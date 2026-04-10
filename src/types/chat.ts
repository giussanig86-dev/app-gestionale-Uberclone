export type MessageSender = 'passenger' | 'driver' | 'system'

export interface ChatMessage {
  id: string
  rideId: string
  senderId: string
  senderType: MessageSender
  senderName: string
  text: string
  timestamp: string
  read: boolean
}

export interface DriverRating {
  rideId: string
  driverId: string
  passengerId: string
  overall: number          // 1-5
  punctuality: number      // 1-5
  cleanliness: number      // 1-5
  courtesy: number         // 1-5
  comment: string
  createdAt: string
}
