"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

type Profile = {
  id: string
  name: string
  username: string
}

type Call = {
  id: string
  caller_id: string
  receiver_id: string
  offer: string | null
  answer: string | null
  status: string
}

export default function VideoCall({
  profile,
  selectedFriend,
}: {
  profile: Profile | null
  selectedFriend: Profile | null
}) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const [call, setCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [inCall, setInCall] = useState(false)

  useEffect(() => {
    if (!profile) return

    const channel = supabase
      .channel("calls-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
          filter: `receiver_id=eq.${profile.id}`,
        },
        (payload) => {
          const newCall = payload.new as Call
          setIncomingCall(newCall)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  async function createPeerConnection(callId: string) {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    peer.onicecandidate = async (event) => {
      if (event.candidate && profile) {
        await supabase.from("call_ice_candidates").insert({
          call_id: callId,
          sender_id: profile.id,
          candidate: JSON.stringify(event.candidate),
        })
      }
    }

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })

    localStreamRef.current = stream

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
    }

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream)
    })

    peerRef.current = peer
    return peer
  }

  async function startCall() {
    if (!profile || !selectedFriend) {
      alert("Select a friend first")
      return
    }

    const { data: callRow, error } = await supabase
      .from("calls")
      .insert({
        caller_id: profile.id,
        receiver_id: selectedFriend.id,
        status: "calling",
      })
      .select("*")
      .single()

    if (error || !callRow) {
      alert(error?.message || "Call failed")
      return
    }

    setCall(callRow)
    setInCall(true)

    const peer = await createPeerConnection(callRow.id)
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)

    await supabase
      .from("calls")
      .update({ offer: JSON.stringify(offer) })
      .eq("id", callRow.id)

    listenForAnswer(callRow.id, peer)
    listenForIceCandidates(callRow.id)
  }

  async function acceptCall() {
    if (!profile || !incomingCall) return

    setCall(incomingCall)
    setInCall(true)

    const peer = await createPeerConnection(incomingCall.id)

    await peer.setRemoteDescription(JSON.parse(incomingCall.offer || "{}"))

    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)

    await supabase
      .from("calls")
      .update({
        answer: JSON.stringify(answer),
        status: "accepted",
      })
      .eq("id", incomingCall.id)

    listenForIceCandidates(incomingCall.id)
    setIncomingCall(null)
  }

  function listenForAnswer(callId: string, peer: RTCPeerConnection) {
    const channel = supabase
      .channel(`answer-${callId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `id=eq.${callId}`,
        },
        async (payload) => {
          const updatedCall = payload.new as Call

          if (updatedCall.answer && !peer.currentRemoteDescription) {
            await peer.setRemoteDescription(JSON.parse(updatedCall.answer))
          }
        }
      )
      .subscribe()
  }

  function listenForIceCandidates(callId: string) {
    const channel = supabase
      .channel(`ice-${callId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_ice_candidates",
          filter: `call_id=eq.${callId}`,
        },
        async (payload) => {
          const row = payload.new as any

          if (row.sender_id === profile?.id) return

          if (peerRef.current && row.candidate) {
            await peerRef.current.addIceCandidate(JSON.parse(row.candidate))
          }
        }
      )
      .subscribe()
  }

  async function endCall() {
    if (call) {
      await supabase.from("calls").update({ status: "ended" }).eq("id", call.id)
    }

    peerRef.current?.close()
    peerRef.current = null

    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null

    setCall(null)
    setIncomingCall(null)
    setInCall(false)
  }

  return (
    <>
      {incomingCall && !inCall && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-blue-800 rounded-2xl p-4 shadow-2xl">
          <p className="text-white font-semibold mb-3">Incoming video call 📹</p>

          <div className="flex gap-2">
            <button
              onClick={acceptCall}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl"
            >
              Accept
            </button>

            <button
              onClick={() => setIncomingCall(null)}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {inCall && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full bg-slate-900 rounded-2xl object-cover"
            />

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full bg-slate-900 rounded-2xl object-cover"
            />
          </div>

          <div className="p-5 flex justify-center">
            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full font-semibold"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      <button
        onClick={startCall}
        className="bg-slate-800 hover:bg-blue-700 px-4 py-2 rounded-lg"
      >
        📹
      </button>
    </>
  )
}