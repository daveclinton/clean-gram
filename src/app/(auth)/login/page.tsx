"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Image from "next/image";
// import { useFormState } from "react-dom";
import { SubmitButton } from "~/components/submit-button";

export default function Login() {
  //   const [state, formAction] = useFormState(login, null);
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center bg-black p-8 text-white lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <h2 className="mb-2 text-3xl font-bold">Create a new account</h2>
          <p className="mb-8 text-gray-400">
            To use clingram, Please enter your details.
          </p>
          <form>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  required
                  className="border-gray-700 bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter your email"
                  required
                  type="email"
                  className="border-gray-700 bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Enter your password"
                  required
                  type="password"
                  className="border-gray-700 bg-gray-800"
                />
              </div>
              {/* {state?.fieldError ? (
                <ul className="bg-destructive/10 text-destructive list-disc space-y-1 rounded-lg border p-2 text-[0.8rem] font-medium">
                  {Object.values(state.fieldError).map((err) => (
                    <li className="ml-4" key={err}>
                      {err}
                    </li>
                  ))}
                </ul>
              ) : state?.formError ? (
                <p className="bg-destructive/10 text-destructive rounded-lg border p-2 text-[0.8rem] font-medium">
                  {state?.formError}
                </p>
              ) : null} */}
              <SubmitButton className="w-full" aria-label="submit-btn">
                Log In
              </SubmitButton>
            </div>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-400">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            type="button"
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            Sign up with Google
          </Button>
          <p className="mt-4 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <a href="#" className="text-indigo-400 hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
      <div className="hidden bg-black lg:block lg:w-1/2">
        <div className="grid grid-cols-2 gap-4 p-8">
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
            <Image
              src="/image.png"
              height={300}
              width={200}
              alt="Content preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
            <Image
              src="/image.png"
              height={300}
              width={200}
              alt="Content preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
            <Image
              src="/image.png"
              height={300}
              width={200}
              alt="Content preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
            <Image
              src="/image.png"
              height={300}
              width={200}
              alt="Content preview"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
