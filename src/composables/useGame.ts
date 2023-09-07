import { computed, ref, watch, type Ref } from "vue"
import { useInterval } from '@vueuse/core'
import { useSupabaseRealtime } from './useSupabase'
import { useModal } from './useModal'

export type BlockState = {
  r: number, // row
  c: number, // col
  mine: boolean,
  flag: boolean,
  open: boolean,
  mineNumber: number
}

export type GameState = {
  fields: BlockState[][],
  status: GameStatus,
}

type GameConfig = {
  row: number,
  col: number,
  mines: number,
  roomId?: string
}

type GameStatus = 'init' | 'playing' | 'win' | 'lose' | 'draw'

const dirs = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
]

export function useGame(config: GameConfig) {
  
  const realtime = useSupabaseRealtime(config.roomId)
  const { open } = useModal()
  const { counter, pause, reset, resume } = useInterval(1000, { controls: true, immediate: false })

  const game = ref() as Ref<GameState>
  const row = ref(config.row)
  const col = ref(config.col)
  const mines = ref(config.mines)
  const onlineStatus = computed(() =>
    realtime?.online.value === 'disconnect' 
      ? 'disconnect'
      : realtime?.online.value === 'wait'
        ? 'Looking for...'
        : realtime?.turn.value ? 'Your turn' : 'Opponent turn'
  )
  const remainFields = computed(() => 
    row.value * col.value - mines.value - game.value.fields.reduce((prev, curr) => prev += curr.filter(c => c.open && !c.mine).length, 0)
  )

  if (realtime) {
    watch(realtime.opponentInit, () => {
      if (realtime.opponentInit.value) {
        game.value = realtime.opponentInit.value['payload']
      }
    })

    watch(realtime.opponentSend, () => {
      if (realtime.opponentSend.value) {
        check(realtime.opponentSend.value['payload']['row'], realtime.opponentSend.value['payload']['col'], true)
      }
    })

    watch(realtime.opponentJudge, async() => {
      if (realtime.opponentJudge.value) {
        const opponentCounter = realtime.opponentJudge.value['payload']['counter']
        game.value.status = counter.value < opponentCounter ? 'win' : counter.value === opponentCounter ? 'draw' : 'lose'
        open(`[${game.value.status}] my: ${counter.value}s, opponent: ${opponentCounter}s`)
        await realtime.judge(counter.value)
        realtime.closeConnection(0)
      }
    })
  }

  function initialize() {
    game.value = {
      status: 'init',
      fields: Array.from({ length: row.value }, (_, r): BlockState[] => 
        Array.from({ length: col.value }, (_, c): BlockState => ({
          r,
          c,
          mine: false,
          flag: false,
          open: false,
          mineNumber: 0
        }))
      )
    }
    reset()
  }

  async function check(r: number, c: number, opponent?: boolean) {
    if (realtime && !realtime.turn.value) {
      return
    }
    if (game.value.status !== 'init' && game.value.status !== 'playing') {
      return
    }
    if (game.value.status === 'init') {
      generateMines(r, c)
      await realtime?.init(game.value)
    }
    if (game.value.fields[r][c].open) {
      return
    }

    if (!opponent) {
      realtime?.send(r, c)
      pause()
    }

    if (game.value.fields[r][c].mine) {
      game.value.status = opponent ? 'win' : 'lose'
      game.value.fields.forEach(f => f.filter(ff => ff.mine && !ff.open).forEach(ff => ff.open = true))
      open(game.value.status)
      pause()
      realtime?.closeConnection(100)
      return
    }

    expand(r, c)

    if (remainFields.value === 0) {
      if (!realtime) {
        game.value.status = 'win'
        open(game.value.status)
      }
      pause()
      realtime?.judge(counter.value)
      return
    }

    if (opponent) {
      resume()
    }
  }

  function flag(r: number, c: number) {
    if (realtime && !realtime.turn.value) {
      return
    }
    if (game.value.status !== 'playing') {
      return
    }
    game.value.fields[r][c].flag = !game.value.fields[r][c].flag
  }

  function generateMines(r: number, c: number) {
    Array.from({ length: mines.value }).forEach(_ => {
      while (true) {
        let field = randomField()
        if (Math.abs(r - field.r) <= 1 && Math.abs(c - field.c) <= 1) {
          continue
        }
        if (!game.value.fields[field.r][field.c].mine) {
          game.value.fields[field.r][field.c].mine = true
          break
        }
      }
    })

    game.value.status = 'playing'
  }

  function randomField() {
    return {
      r: Math.floor(Math.random() * row.value),
      c: Math.floor(Math.random() * col.value),
    }
  }

  function getNeighbors(r: number, c: number) {
    return dirs
      .map(([dr, dc]) => {
        if (r + dr < 0 || r + dr >= row.value || c + dc < 0 || c + dc >= col.value) {
          return
        }
        return game.value.fields[r + dr][c + dc]
      })
      .filter(Boolean) as BlockState[]
  }

  function expand(r: number, c: number) {
    const neighbors = getNeighbors(r, c)
    const mineNumber = neighbors.filter(n => n.mine).length
    game.value.fields[r][c].open = true
    game.value.fields[r][c].mineNumber = mineNumber

    neighbors.forEach(n => {
      if (n.flag || n.open || n.mine) {
        return
      }
      if (mineNumber === 0) {
        expand(n.r, n.c)
      }
    })
  }

  function changeConfig(config: GameConfig) {
    row.value = config.row
    col.value = config.col
    mines.value = config.mines
    initialize()
  }

  return {
    row,
    col,
    game,
    onlineStatus,
    counter,
    check,
    flag,
    initialize,
    changeConfig
  }
}