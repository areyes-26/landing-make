'use server';
/**
 * @fileOverview AI-powered content categorization flow.
 *
 * - categorizeContent - A function that categorizes the suggested content.
 * - CategorizeContentInput - The input type for the categorizeContent function.
 * - CategorizeContentOutput - The return type for the categorizeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeContentInputSchema = z.object({
  content: z.string().describe('The suggested content to categorize.'),
});
export type CategorizeContentInput = z.infer<typeof CategorizeContentInputSchema>;

const CategorizeContentOutputSchema = z.object({
  category: z.string().describe('The category of the suggested content.'),
  isAppropriate: z.boolean().describe('Whether the content is appropriate or not.'),
});
export type CategorizeContentOutput = z.infer<typeof CategorizeContentOutputSchema>;

export async function categorizeContent(input: CategorizeContentInput): Promise<CategorizeContentOutput> {
  return categorizeContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeContentPrompt',
  input: {schema: CategorizeContentInputSchema},
  output: {schema: CategorizeContentOutputSchema},
  prompt: `You are a content categorization expert. Given the following content, determine its category and whether it is appropriate.\n\nContent: {{{content}}}`,
});

const categorizeContentFlow = ai.defineFlow(
  {
    name: 'categorizeContentFlow',
    inputSchema: CategorizeContentInputSchema,
    outputSchema: CategorizeContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
