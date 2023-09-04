import { Ref, inject, onUnmounted, provide, ref } from 'vue'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { GameState } from './useGame'

type Client = SupabaseClient<any, "public", any>
type OnlineStatus = 'wait' | 'disconnect' | 'connect'

const SUPABASE_KEY = '__supabase'

export function provideSupabase() {
  const client = createClient(
    import.meta.env.VITE_SUPABASE_URI,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  provide<Client>(SUPABASE_KEY, client)
}

export function useSupabase() {
  const client = inject<Client>(SUPABASE_KEY)
  if (!client) {
    throw new Error('supabase initialize error')
  }

  onUnmounted(() => {
    client.removeAllChannels()
  })

  return client
}

export function useSupabaseRealtime(roomId: string | undefined) {
  if (!roomId) {
    return
  }
  
  const client = useSupabase()
  const channel = client.channel(roomId)

  const turn: Ref<boolean | undefined> = ref(undefined)
  const online: Ref<OnlineStatus> = ref('wait')
  const opponentInit: Ref<{[key: string]: any} | undefined> = ref(undefined)
  const opponentSend: Ref<{[key: string]: any} | undefined> = ref(undefined)
  const opponentJudge: Ref<{[key: string]: any} | undefined> = ref(undefined)
  const myId = window.crypto.randomUUID()
  const myCreateAt = new Date().getTime()
  let opponentKey: string | undefined = undefined

  channel
    .on(
      'broadcast',
      { event: 'init' },
      (payload) => {
        opponentInit.value = payload
      }
    )
    .on(
      'broadcast',
      { event: 'send' },
      (payload) => {
        turn.value = true
        opponentSend.value = payload
      }
    )
    .on(
      'broadcast',
      { event: 'judge' },
      (payload) => {
        opponentJudge.value = payload
      }
    )
    .on(
      'presence',
      { event: 'sync' },
      () => {
        const newState = channel.presenceState()
        const beforeJoinMembers = Object.keys(newState).filter(key => myCreateAt >= (newState[key] as any)[0]['create_at']).length
        if (beforeJoinMembers > 2) {
          channel.untrack()
          channel.unsubscribe()
          alert('already room filled')
        }
      }
    )
    .on(
      'presence',
      { event: 'join' },
      ({ key, newPresences }) => {
        if (newPresences.find(p => p.user === myId)) {
          return
        }
        if (!opponentKey) {
          opponentKey = key
          turn.value = myCreateAt <= newPresences[0]['create_at']
          online.value = 'connect'
        }
      }
    )
    .on(
      'presence',
      { event: 'leave' },
      ({ key }) => {
        if (key === opponentKey) {
          online.value = 'disconnect'
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          user: myId,
          create_at: myCreateAt,
        })
      }
    })

  async function init(state: GameState) {
    turn.value = false
    await channel.send({
      type: 'broadcast',
      event: 'init',
      payload: state,
    })
  }

  function send(row: number, col: number) {
    turn.value = false
    // 1 message per 100 second
    setTimeout(() => channel.send({
      type: 'broadcast',
      event: 'send',
      payload: {
        row,
        col
      },
    }), 100)
  }

  async function judge(counter: number) {
    // 1 message per 100 second
    await new Promise(resolve => {
      setTimeout(async() => {
        const response = await channel.send({
          type: 'broadcast',
          event: 'judge',
          payload: {
            counter,
          },
        })
        resolve(response)
      }, 100)
    })
  }

  function closeConnection(wait: number) {
    setTimeout(() => {
      channel.untrack()
      channel.unsubscribe()
    }, wait)
  }

  onUnmounted(() => {
    closeConnection(0)
  })

  return { turn, online, opponentInit, opponentSend, opponentJudge, init, send, judge, closeConnection }
}