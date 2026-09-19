import { z } from "zod";

export const moviePreferenceSchema = z.object({
  liked: z.boolean().nullable().optional(),
  viewed: z.boolean().default(false),
  rating: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
}).refine((preference) => preference.rating === null || preference.rating === undefined || preference.viewed, {
  message: "A movie must be viewed before it can be rated.",
  path: ["rating"],
});

export function preferenceWeight(liked: boolean | null | undefined, rating: number | null | undefined) {
  return (liked === true ? 2 : liked === false ? -2 : 0) + (rating ?? 0) / 5;
}