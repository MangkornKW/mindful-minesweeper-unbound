
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LoginButton: React.FC = () => {
  const { user, signInWithGoogle, signOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.name} />
              <AvatarFallback>{user.user_metadata.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={() => signInWithGoogle()}>
      <svg
        className="mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12c6.627 0 12-5.373 12-12s-5.373-12-12-12zm.029 17.197c-2.808 0-5.062-2.303-5.062-5.145 0-2.842 2.254-5.145 5.062-5.145 1.343 0 2.471.5 3.349 1.305l-1.33 1.34c-.583-.559-1.338-.88-2.019-.88-1.747 0-3.153 1.44-3.153 3.38 0 1.94 1.406 3.38 3.153 3.38.714 0 1.356-.177 1.857-.496.57-.362.942-.952 1.057-1.756h-2.914v-1.891h4.818c.085.323.131.665.131 1.037 0 1.208-.313 2.288-1.175 3.039-.879.77-2.029 1.182-3.417 1.182z"></path>
      </svg>
      Sign in with Google
    </Button>
  );
};

export default LoginButton;
