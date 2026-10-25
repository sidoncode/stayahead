export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  pinned: boolean
  createdAt: number
  updatedAt: number
}
