import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { insertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { Disc3, Music, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  username: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Redirect to home if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row shadow-2xl rounded-lg overflow-hidden">
        {/* Left side: Auth form */}
        <div className="w-full md:w-1/2 bg-charcoal p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-10 h-10 mr-2">
              <div className="absolute inset-0 bg-burgundy rounded-full record-grooves"></div>
            </div>
            <h1 className="text-3xl font-heading font-bold text-amber">VinylVault</h1>
          </div>

          {isLogin ? (
            // Login Form
            <div>
              <h2 className="text-2xl font-heading font-bold text-center mb-6">Sign In</h2>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Email</Label>
                  <Input
                    id="username"
                    type="email"
                    className="bg-navy border-amber/30 focus:ring-amber"
                    {...loginForm.register("username")}
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-navy border-amber/30 focus:ring-amber"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-burgundy hover:bg-burgundy/90 text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sign In
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-cream">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-amber hover:underline"
                    onClick={() => setIsLogin(false)}
                  >
                    Register
                  </button>
                </p>
              </div>
            </div>
          ) : (
            // Register Form
            <div>
              <h2 className="text-2xl font-heading font-bold text-center mb-6">Create Account</h2>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    className="bg-navy border-amber/30 focus:ring-amber"
                    {...registerForm.register("name")}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-username">Email</Label>
                  <Input
                    id="reg-username"
                    type="email"
                    className="bg-navy border-amber/30 focus:ring-amber"
                    {...registerForm.register("username")}
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    className="bg-navy border-amber/30 focus:ring-amber"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="bg-navy border-amber/30 focus:ring-amber"
                    {...registerForm.register("confirmPassword")}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-burgundy hover:bg-burgundy/90 text-white"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create Account
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-cream">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-amber hover:underline"
                    onClick={() => setIsLogin(true)}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Hero section */}
        <div className="w-full md:w-1/2 bg-burgundy/90 p-8 flex flex-col justify-center">
          <div className="text-center mb-6">
            <Disc3 className="h-16 w-16 text-amber mx-auto mb-4" />
            <h2 className="text-3xl font-heading font-bold text-cream">Your Digital Record Collection</h2>
          </div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <Music className="h-5 w-5 text-amber mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-cream">Catalog your vinyl records with detailed information</span>
            </li>
            <li className="flex items-start">
              <Music className="h-5 w-5 text-amber mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-cream">Automatic lookup for release year and genre metadata</span>
            </li>
            <li className="flex items-start">
              <Music className="h-5 w-5 text-amber mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-cream">Add custom fields for personalized record details</span>
            </li>
            <li className="flex items-start">
              <Music className="h-5 w-5 text-amber mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-cream">Search, filter, and browse your collection with ease</span>
            </li>
          </ul>
          
          <p className="text-cream/70 text-sm text-center">
            Join other vinyl enthusiasts and start organizing your collection today!
          </p>
        </div>
      </div>
    </div>
  );
}
