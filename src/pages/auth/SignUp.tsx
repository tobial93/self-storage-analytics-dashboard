import { SignUp as ClerkSignUp } from '@clerk/clerk-react'

export function SignUp() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md">
        <ClerkSignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
            },
          }}
        />
      </div>
    </div>
  )
}
