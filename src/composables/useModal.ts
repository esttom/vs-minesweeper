import { Ref, inject, provide, ref } from 'vue'

const MODAL_KEY = '__modal'

type ModalConfig = {
  isOpen: Ref<boolean>,
  result: Ref<string>,
  open: (result: string) => void,
  close: () => void
}

export function provideModal() {
  const isOpen = ref(false)
  const result = ref('')

  function open(_result: string) {
    result.value = _result
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  provide<ModalConfig>(MODAL_KEY, {
    isOpen,
    result,
    open,
    close
  })
}

export function useModal() {
  const modal = inject<ModalConfig>(MODAL_KEY)
  if (!modal) {
    throw new Error('modal initialize error')
  }
  return modal
}