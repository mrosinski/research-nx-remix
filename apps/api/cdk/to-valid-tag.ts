/**
 * Filters out invalid tag characters (https://docs.aws.amazon.com/tag-editor/latest/userguide/tagging.html).
 * Throws an error if the resulting tag has zero length.
 */
export const toValidTag = (tag: string): string => {
  const validTag = tag.replace(
    /[^a-zA-Z0-9_.:/=+@\f\n\r\t\v\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff-]/g,
    ''
  )

  if (!validTag) {
    throw new Error(`The valid tag for '${tag}' is an empty string.`)
  }

  return validTag
}
