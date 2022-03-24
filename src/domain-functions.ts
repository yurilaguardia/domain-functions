import * as z from 'zod'
import { DomainFunction } from './types'

type MakeDomainFunction = <
  Schema extends z.ZodTypeAny,
  EnvSchema extends z.ZodTypeAny,
>(
  inputSchema: Schema,
  environmentSchema?: EnvSchema,
) => <Output>(
  handler: (
    inputSchema: z.infer<Schema>,
    environmentSchema: z.infer<EnvSchema>,
  ) => Promise<Output>,
) => DomainFunction<Output>

const makeDomainFunction: MakeDomainFunction =
  (
    inputSchema: z.ZodTypeAny = z.object({}),
    environmentSchema: z.ZodTypeAny = z.object({}),
  ) =>
  (handler) => {
    const domainFunction = (async (input, environment = {}) => {
      const envResult = environmentSchema.safeParse(environment)
      const result = inputSchema.safeParse(input)

      if (result.success === false) {
        return {
          success: false,
          errors: [],
          inputErrors: result.error.issues,
          data: null,
        }
      } else if (envResult.success === false) {
        return {
          success: false,
          errors: envResult.error.issues,
          inputErrors: [],
          data: null,
        }
      }
      try {
        return {
          success: true,
          data: await handler(result.data, envResult.data),
          errors: [],
          inputErrors: [],
        }
      } catch (error) {
        const errors = [{ message: (error as Error).message }]
        return { success: false, errors, inputErrors: [], data: null }
      }
    }) as DomainFunction<Awaited<ReturnType<typeof handler>>>
    return domainFunction
  }

export { makeDomainFunction }
