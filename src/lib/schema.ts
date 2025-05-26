import { z } from 'zod';

export const submissionSchema = z.object({
  suggestedTitle: z.string().min(3, { message: "Title must be at least 3 characters long." }).max(100, { message: "Title must be 100 characters or less." }),
  suggestedContent: z.string().min(10, { message: "Content must be at least 10 characters long." }).max(5000, { message: "Content must be 5000 characters or less." }),
  avatarId: z.string().min(1, { message: "Avatar ID is required." }).max(50, { message: "Avatar ID must be 50 characters or less." }),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;
