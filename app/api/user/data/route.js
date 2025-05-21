import connectDB from "@/config/db"
import User from "@/models/User"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs" // 👈 necesario para obtener más info del usuario

export async function GET(request) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    let user = await User.findById(userId)

    // Si no existe en tu DB, lo creas usando datos reales de Clerk
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
