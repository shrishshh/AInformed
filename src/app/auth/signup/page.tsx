"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useSupabaseAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { data, error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Don't redirect immediately - show success message
      // router.push('/');
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>Create a new account to save bookmarks</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="p-4 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <p className="font-semibold mb-2">Account created successfully!</p>
                <p>Please check your email ({email}) and click the confirmation link to verify your account.</p>
                <p className="mt-2 text-xs text-muted-foreground">After confirming, you can sign in.</p>
              </div>
            )}
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

