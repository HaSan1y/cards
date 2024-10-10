'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

export default function Component() {
   const [isLogin, setIsLogin] = useState(true)
   const [username, setUsername] = useState('')
   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [error, setError] = useState('')
   const [success, setSuccess] = useState('')

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setSuccess('')

      // Basic validation
      if (!username || !password || (!isLogin && !email)) {
         setError('Please fill in all fields')
         return
      }

      if (!isLogin && !email.includes('@')) {
         setError('Please enter a valid email address')
         return
      }

      // Here you would typically make an API call to your backend
      // For this example, we'll just simulate a successful login/register
      setTimeout(() => {
         setSuccess(isLogin ? 'Login successful!' : 'Registration successful!')
      }, 1000)
   }

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
         <Card className="w-full max-w-md">
            <CardHeader>
               <CardTitle>{isLogin ? 'Login' : 'Register'}</CardTitle>
               <CardDescription>
                  {isLogin ? 'Welcome back! Please login to your account.' : 'Create a new account to get started.'}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="username">Username</Label>
                     <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                     />
                  </div>
                  {!isLogin && (
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                           id="email"
                           type="email"
                           placeholder="Enter your email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                        />
                     </div>
                  )}
                  <div className="space-y-2">
                     <Label htmlFor="password">Password</Label>
                     <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                  </div>
                  {error && (
                     <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                     </Alert>
                  )}
                  {success && (
                     <Alert>
                        <AlertDescription>{success}</AlertDescription>
                     </Alert>
                  )}
                  <Button type="submit" className="w-full">
                     {isLogin ? 'Login' : 'Register'}
                  </Button>
               </form>
            </CardContent>
            <CardFooter className="flex justify-between">
               <Label htmlFor="login-switch" className="text-sm text-muted-foreground">
                  {isLogin ? 'Need an account?' : 'Already have an account?'}
               </Label>
               <Switch
                  id="login-switch"
                  checked={!isLogin}
                  onCheckedChange={() => setIsLogin(!isLogin)}
               />
            </CardFooter>
         </Card>
      </div>
   )
}
const [email, setEmail] = useState('')

const handleSubmit = (e: React.FormEvent) => {
   e.preventDefault()
   // Handle form submission logic here
   console.log('Submitted email:', email)
}
< !--onSubmit={ handleSubmit } value = { email }
onChange = {(e) => setEmail(e.target.value)} -->