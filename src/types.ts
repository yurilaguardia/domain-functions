import type * as z from 'zod'

type SuccessResult<T = void> = {
  success: true
  data: T
  errors: []
  inputErrors: []
}
type ErrorResult = {
  success: false
  data: null
  errors: z.ZodIssue[] | { message: string }[]
  inputErrors: z.ZodIssue[]
}
type Result<T = void> = SuccessResult<T> | ErrorResult

type DomainFunction<Output = unknown> = {
  (input: object, environment?: object): Promise<Result<Output>>
}

type UnpackResult<F extends DomainFunction> = Awaited<ReturnType<F>>
type UnpackSuccess<F extends DomainFunction> = Extract<
  UnpackResult<F>,
  { success: true }
>
type UnpackData<F extends DomainFunction> = UnpackSuccess<F>['data']

export type {
  DomainFunction,
  Result,
  SuccessResult,
  ErrorResult,
  UnpackResult,
  UnpackSuccess,
  UnpackData,
}
