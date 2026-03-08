import { SignIn as ClerkSignIn } from '@clerk/clerk-react'

export function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md">
        <ClerkSignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
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
