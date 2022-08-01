import * as z from 'zod'
import { Merge2, Merge3, Merge4, Merge5, UnpackData } from './types'
import {
  EnvironmentError,
  InputError,
  InputErrors,
  schemaError,
  toErrorWithMessage,
} from './errors'
import {
  DomainFunction,
  ErrorData,
  GenericRecord,
  Result,
  SchemaError,
  SuccessResult,
} from './types'

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyObject = {}
type MakeDomainFunction = <
  InpSchema extends z.ZodTypeAny,
  EnvSchema extends z.AnyZodObject,
>(
  inputSchema: InpSchema,
  environmentSchema?: EnvSchema,
) => <Output>(
  handler: (
    inputSchema: z.infer<InpSchema>,
    environmentSchema?: z.infer<EnvSchema>,
  ) => Promise<Output>,
) => DomainFunction<Output, z.infer<EnvSchema>>

const makeDomainFunction: MakeDomainFunction =
  (
    inputSchema: z.ZodTypeAny = z.object({}),
    environmentSchema: z.AnyZodObject = z.object({}),
  ) =>
  (
    handler,
  ): DomainFunction<
    Awaited<ReturnType<typeof handler>>,
    z.infer<typeof environmentSchema>
  > =>
  async (input, environment = {}) => {
    const envResult = await environmentSchema.safeParseAsync(environment)
    const result = await inputSchema.safeParseAsync(input)

    try {
      if (result.success === true && envResult.success === true) {
        return {
          success: true,
          data: await handler(result.data, envResult.data),
          errors: [],
          inputErrors: [],
          environmentErrors: [],
        }
      }
    } catch (error) {
      if (error instanceof InputError) {
        return {
          success: false,
          errors: [],
          environmentErrors: [],
          inputErrors: [schemaError(error.message, error.path)],
        }
      }
      if (error instanceof EnvironmentError) {
        return {
          success: false,
          errors: [],
          environmentErrors: [schemaError(error.message, error.path)],
          inputErrors: [],
        }
      }
      if (error instanceof InputErrors) {
        return {
          success: false,
          errors: [],
          environmentErrors: [],
          inputErrors: error.errors.map((e) => schemaError(e.message, e.path)),
        }
      }
      return {
        success: false,
        errors: [toErrorWithMessage(error)],
        inputErrors: [],
        environmentErrors: [],
      }
    }
    return {
      success: false,
      errors: [],
      inputErrors: result.success
        ? []
        : formatSchemaErrors(result.error.issues),
      environmentErrors: envResult.success
        ? []
        : formatSchemaErrors(envResult.error.issues),
    }
  }

function formatSchemaErrors(errors: z.ZodIssue[]): SchemaError[] {
  return errors.map((error) => {
    const { path, message } = error
    return { path: path.map(String), message }
  })
}

type UnpackEnv<T> = T extends DomainFunction<infer I, infer E>
  ? E extends Record<any, any>
    ? E
    : EmptyObject
  : never

function all<T1 extends DomainFunction, T2 extends DomainFunction>(
  d1: T1,
  d2: T2,
): DomainFunction<
  [UnpackData<T1>, UnpackData<T2>],
  Merge2<UnpackEnv<T1>, UnpackEnv<T2>>
>
function all<
  T1 extends DomainFunction,
  T2 extends DomainFunction,
  T3 extends DomainFunction,
>(
  d1: T1,
  d2: T2,
  d3: T3,
): DomainFunction<
  [UnpackData<T1>, UnpackData<T2>, UnpackData<T3>],
  Merge3<UnpackEnv<T1>, UnpackEnv<T2>, UnpackEnv<T3>>
>
function all<
  T1 extends DomainFunction,
  T2 extends DomainFunction,
  T3 extends DomainFunction,
  T4 extends DomainFunction,
>(
  d1: T1,
  d2: T2,
  d3: T3,
  d4: T4,
): DomainFunction<
  [UnpackData<T1>, UnpackData<T2>, UnpackData<T3>, UnpackData<T4>],
  Merge4<UnpackEnv<T1>, UnpackEnv<T2>, UnpackEnv<T3>, UnpackEnv<T4>>
>
function all<
  T1 extends DomainFunction,
  T2 extends DomainFunction,
  T3 extends DomainFunction,
  T4 extends DomainFunction,
  T5 extends DomainFunction,
>(
  d1: T1,
  d2: T2,
  d3: T3,
  d4: T4,
  d5: T5,
): DomainFunction<
  [
    UnpackData<T1>,
    UnpackData<T2>,
    UnpackData<T3>,
    UnpackData<T4>,
    UnpackData<T5>,
  ],
  Merge5<
    UnpackEnv<T1>,
    UnpackEnv<T2>,
    UnpackEnv<T3>,
    UnpackEnv<T4>,
    UnpackEnv<T5>
  >
>
function all(...fns: DomainFunction[]): DomainFunction {
  return async (input, environment) => {
    const results = await Promise.all(
      fns.map((fn) => (fn as DomainFunction)(input, environment)),
    )

    if (!isListOfSuccess(results)) {
      return {
        success: false,
        errors: results.map(({ errors }) => errors).flat(),
        inputErrors: results.map(({ inputErrors }) => inputErrors).flat(),
        environmentErrors: results
          .map(({ environmentErrors }) => environmentErrors)
          .flat(),
      }
    }

    return {
      success: true,
      data: results.map(({ data }) => data),
      inputErrors: [],
      environmentErrors: [],
      errors: [],
    }
  }
}

function isListOfSuccess<T>(result: Result<T>[]): result is SuccessResult<T>[] {
  return result.every(({ success }) => success === true)
}

function pipe<T1 extends DomainFunction, T2 extends DomainFunction>(
  d1: T1,
  d2: T2,
): DomainFunction<UnpackData<T2>, Merge2<UnpackEnv<T1>, UnpackEnv<T2>>>
function pipe<
  T1 extends DomainFunction,
  T2 extends DomainFunction,
  T3 extends DomainFunction,
>(
  d1: T1,
  d2: T2,
  d3: T3,
): DomainFunction<
  UnpackData<T3>,
  Merge3<UnpackEnv<T1>, UnpackEnv<T2>, UnpackEnv<T3>>
>
function pipe<
  T1 extends DomainFunction,
  T2 extends DomainFunction,
  T3 extends DomainFunction,
  T4 extends DomainFunction,
>(
  d1: T1,
  d2: T2,
  d3: T3,
  d4: T4,
): DomainFunction<
  UnpackData<T4>,
  Merge4<UnpackEnv<T1>, UnpackEnv<T2>, UnpackEnv<T3>, UnpackEnv<T4>>
>
function pipe<
  T1 extends DomainFunction,
  T2 extends DomainFunction,
  T3 extends DomainFunction,
  T4 extends DomainFunction,
  T5 extends DomainFunction,
>(
  d1: T1,
  d2: T2,
  d3: T3,
  d4: T4,
  d5: T5,
): DomainFunction<
  UnpackData<T5>,
  Merge5<
    UnpackEnv<T1>,
    UnpackEnv<T2>,
    UnpackEnv<T3>,
    UnpackEnv<T4>,
    UnpackEnv<T5>
  >
>
function pipe(...fns: DomainFunction[]): DomainFunction {
  const [head, ...tail] = fns

  return (input: unknown, environment?: GenericRecord) => {
    return tail.reduce(async (memo, fn) => {
      const resolved = await memo
      if (resolved.success) {
        return fn(resolved.data as unknown, environment)
      } else {
        return memo
      }
    }, head(input, environment))
  }
}

type Map = <O, R, E extends GenericRecord>(
  dfn: DomainFunction<O, E>,
  mapper: (element: O) => R,
) => DomainFunction<R, E>
const map: Map = (dfn, mapper) => {
  return async (input, environment) => {
    const result = await dfn(input, environment)
    if (!result.success) return result

    try {
      return {
        success: true,
        data: mapper(result.data),
        errors: [],
        inputErrors: [],
        environmentErrors: [],
      }
    } catch (error) {
      const errors = [toErrorWithMessage(error)]
      return {
        success: false,
        errors,
        inputErrors: [],
        environmentErrors: [],
      }
    }
  }
}

type MapError = <O, E extends GenericRecord>(
  dfn: DomainFunction<O, E>,
  mapper: (element: ErrorData) => ErrorData,
) => DomainFunction<O, E>
const mapError: MapError = (dfn, mapper) => {
  return async (input, environment) => {
    const result = await dfn(input, environment)
    if (result.success) return result

    try {
      return { ...mapper(result), success: false }
    } catch (error) {
      const errors = [toErrorWithMessage(error)]
      return {
        success: false,
        errors,
        inputErrors: [],
        environmentErrors: [],
      }
    }
  }
}

export { makeDomainFunction, all, pipe, map, mapError }
