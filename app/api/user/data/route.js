import connectDB from "@/config/db"
import User from "@/models/User"
import { getAuth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node" // ✅ este sí funciona
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    await connectDB()
    let user = await User.findById(userId)

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId)

      user = await User.create({
        _id: userId,
        name: clerkUser.firstName + " " + clerkUser.lastName,
        email: clerkUser.emailAddresses[0].emailAddress,
        imageUrl: clerkUser.imageUrl,
        cartItems: {},
      })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message })
  }
}
