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
  call_type?: string | null
}

export default function VideoCall({
  profile,
  selectedFriend,
  audioOnly = false,
}: {
  profile: Profile | null
  selectedFriend: Profile | null
  audioOnly?: boolean
}) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)

  const [call, setCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [inCall, setInCall] = useState(false)

  useEffect(() => {
    ringtoneRef.current = new Audio("/ringtone.mp3")
    ringtoneRef.current.loop = true
  }, [])

  useEffect(() => {
    if (!profile) return

    const channel = supabase
      .channel(`calls-listener-${profile.id}-${audioOnly ? "audio" : "video"}`)
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

          if (audioOnly && newCall.call_type !== "audio") return
          if (!audioOnly && newCall.call_type === "audio") return

          setIncomingCall(newCall)

          ringtoneRef.current
            ?.play()
            .catch(() => {
              console.log("Ringtone blocked until user interacts with page")
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, audioOnly])

  function stopRingtone() {
    if (!ringtoneRef.current) return

    ringtoneRef.current.pause()
    ringtoneRef.current.currentTime = 0
  }

  async function createPeerConnection(callId: string, onlyAudio: boolean) {
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
        remoteVideoRef.current.play().catch(() => {})
      }
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera/mic works only on localhost or HTTPS")
      throw new Error("getUserMedia not supported")
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: !onlyAudio,
      audio: true,
    })

    localStreamRef.current = stream

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
      localVideoRef.current.play().catch(() => {})
    }

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream)
    })

    peerRef.current = peer
    return peer
  }

  async function flushPendingCandidates() {
    if (!peerRef.current?.remoteDescription) return

    for (const candidate of pendingCandidatesRef.current) {
      await peerRef.current.addIceCandidate(candidate)
    }

    pendingCandidatesRef.current = []
  }

  function listenForIceCandidates(callId: string) {
    supabase
      .channel(`ice-${callId}-${profile?.id}-${audioOnly ? "audio" : "video"}`)
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

          const candidate = JSON.parse(row.candidate)

          if (peerRef.current?.remoteDescription) {
            await peerRef.current.addIceCandidate(candidate)
          } else {
            pendingCandidatesRef.current.push(candidate)
          }
        }
      )
      .subscribe()
  }

  function listenForAnswer(callId: string, peer: RTCPeerConnection) {
    supabase
      .channel(`answer-${callId}-${audioOnly ? "audio" : "video"}`)
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
            await flushPendingCandidates()
          }

          if (updatedCall.status === "ended") {
            endCall()
          }
        }
      )
      .subscribe()
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
        call_type: audioOnly ? "audio" : "video",
      })
      .select("*")
      .single()

    if (error || !callRow) {
      alert(error?.message || "Call failed")
      return
    }

    setCall(callRow)
    setInCall(true)

    const peer = await createPeerConnection(callRow.id, audioOnly)
    listenForIceCandidates(callRow.id)

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)

    await supabase
      .from("calls")
      .update({ offer: JSON.stringify(offer) })
      .eq("id", callRow.id)

    listenForAnswer(callRow.id, peer)
  }

  async function acceptCall() {
    if (!profile || !incomingCall) return

    stopRingtone()

    const { data: freshCall } = await supabase
      .from("calls")
      .select("*")
      .eq("id", incomingCall.id)
      .single()

    if (!freshCall?.offer) {
      alert("Call offer not ready. Try again.")
      return
    }

    setCall(freshCall)
    setInCall(true)

    const onlyAudio = freshCall.call_type === "audio"
    const peer = await createPeerConnection(freshCall.id, onlyAudio)
    listenForIceCandidates(freshCall.id)

    await peer.setRemoteDescription(JSON.parse(freshCall.offer))
    await flushPendingCandidates()

    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)

    await supabase
      .from("calls")
      .update({
        answer: JSON.stringify(answer),
        status: "accepted",
      })
      .eq("id", freshCall.id)

    setIncomingCall(null)
  }

  async function declineCall() {
    stopRingtone()

    if (incomingCall) {
      await supabase
        .from("calls")
        .update({ status: "declined" })
        .eq("id", incomingCall.id)
    }

    setIncomingCall(null)
  }

  async function endCall() {
    stopRingtone()

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
          <p className="text-white font-semibold mb-3">
            Incoming {incomingCall.call_type === "audio" ? "audio" : "video"} call
          </p>

          <div className="flex gap-2">
            <button
              onClick={acceptCall}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl"
            >
              Accept
            </button>

            <button
              onClick={declineCall}
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
        {audioOnly ? "📞" : "📹"}
      </button>
    </>
  )
}