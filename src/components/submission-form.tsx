// src/components/submission-form.tsx
'use client';

import { useEffect } from 'react';
import { useActionState } from 'react'; // Updated usage
import { useFormStatus } from 'react-dom'; // Corrected import for useFormStatus
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { submissionSchema, type SubmissionFormData } from '@/lib/schema';
import { submitFormAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetsLogo } from '@/components/icons/sheets-logo';

const initialState = {
  success: false,
  message: '',
  category: null,
  errors: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Submit Suggestion
    </Button>
  );
}

export function SubmissionForm() {
  const [state, formAction] = useActionState(submitFormAction, initialState);
  const { toast } = useToast();

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      suggestedTitle: '',
      suggestedContent: '',
      avatarId: '',
    },
  });

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: 'Success!',
          description: state.message,
          variant: 'default', // Will use accent color due to theme setup if styled correctly
        });
        form.reset(); // Reset form on successful submission
      } else {
        toast({
          title: 'Error',
          description: state.message,
          variant: 'destructive',
        });
      }
    }
    // Clear field-specific errors from react-hook-form if server provides new general errors
    if (state?.errors) {
        form.clearErrors(); // Clear previous RHF errors
        state.errors.forEach(err => {
            if (err.path && err.path.length > 0) {
                 // @ts-ignore
                form.setError(err.path[0] as keyof SubmissionFormData, { type: 'server', message: err.message });
            }
        });
    } else if (state?.success === false && state?.message && !state.errors) {
        // If there's a general server error not tied to specific fields, clear RHF errors.
        form.clearErrors();
    }

  }, [state, toast, form]);
  
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          <SheetsLogo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">SheetSync</CardTitle>
        <CardDescription>Submit your content suggestion. It will be categorized by AI and sent to Google Sheets.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="suggestedTitle">Suggested Title</Label>
            <Input
              id="suggestedTitle"
              placeholder="Enter a catchy title for the video"
              {...register('suggestedTitle')}
              aria-invalid={errors.suggestedTitle ? "true" : "false"}
            />
            {errors.suggestedTitle && <p className="text-sm text-destructive">{errors.suggestedTitle.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestedContent">Suggested Content</Label>
            <Textarea
              id="suggestedContent"
              placeholder="Describe the content suggestion in detail"
              rows={5}
              {...register('suggestedContent')}
              aria-invalid={errors.suggestedContent ? "true" : "false"}
            />
            {errors.suggestedContent && <p className="text-sm text-destructive">{errors.suggestedContent.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarId">Avatar ID</Label>
            <Input
              id="avatarId"
              placeholder="Enter the Avatar ID"
              {...register('avatarId')}
              aria-invalid={errors.avatarId ? "true" : "false"}
            />
            {errors.avatarId && <p className="text-sm text-destructive">{errors.avatarId.message}</p>}
          </div>
          
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
