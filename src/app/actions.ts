'use server';

import { z } from 'zod';
import { submissionSchema, type SubmissionFormData } from '@/lib/schema';
import { categorizeContent } from '@/ai/flows/categorize-content';

interface ActionResult {
  success: boolean;
  message: string;
  category?: string | null;
  errors?: z.ZodIssue[];
}

export async function submitFormAction(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const rawFormData = {
    suggestedTitle: formData.get('suggestedTitle'),
    suggestedContent: formData.get('suggestedContent'),
    avatarId: formData.get('avatarId'),
  };

  const validatedFields = submissionSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: validatedFields.error.issues,
    };
  }

  const { suggestedTitle, suggestedContent, avatarId } = validatedFields.data;

  try {
    // AI Content Categorization
    const categorizationResult = await categorizeContent({ content: suggestedContent });
    if (!categorizationResult.isAppropriate) {
      return {
        success: false,
        message: `Content not appropriate. Category: ${categorizationResult.category}. Please revise.`,
        category: categorizationResult.category,
      };
    }

    const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!googleScriptUrl) {
      console.error('GOOGLE_SCRIPT_URL is not set.');
      return {
        success: false,
        message: 'Server configuration error. Unable to submit data.',
      };
    }

    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        suggestedTitle,
        suggestedContent,
        avatarId,
        aiCategory: categorizationResult.category, // Send AI category to Google Sheet
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error from Google Sheets.' }));
      console.error('Error sending data to Google Sheets:', response.status, errorData);
      return {
        success: false,
        message: `Error submitting to Google Sheets: ${errorData.message || response.statusText}`,
      };
    }

    const resultData = await response.json();
    if (!resultData.success) {
        return {
            success: false,
            message: `Google Sheets reported an error: ${resultData.message}`,
        };
    }
    
    return {
      success: true,
      message: `Suggestion '${suggestedTitle}' submitted successfully and categorized as '${categorizationResult.category}'.`,
      category: categorizationResult.category,
    };

  } catch (error) {
    console.error('Error in submitFormAction:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      success: false,
      message: errorMessage,
    };
  }
}
