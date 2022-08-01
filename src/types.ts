import { Merge } from 'type-fest'

type ErrorWithMessage = {
  message: string
}

type SuccessResult<T = void> = {
  success: true
  data: T
  errors: []
  inputErrors: []
  environmentErrors: []
}
type ErrorResult = {
  success: false
  errors: ErrorWithMessage[]
  inputErrors: SchemaError[]
  environmentErrors: SchemaError[]
}
type SchemaError = {
  path: string[]
  message: string
}

type ErrorData = Omit<ErrorResult, 'success'>

type Result<T = void> = SuccessResult<T> | ErrorResult

type GenericRecord = Record<string | symbol | number, unknown>
type DomainFunction<Output = unknown, Environment = GenericRecord> = {
  (input: unknown, environment?: Environment): Promise<Result<Output>>
}

type UnpackResult<F extends DomainFunction> = Awaited<ReturnType<F>>
type UnpackSuccess<F extends DomainFunction> = Extract<
  UnpackResult<F>,
  { success: true }
>
type UnpackData<F extends DomainFunction> = UnpackSuccess<F>['data']

type Merge2<T1, T2> = Merge<T1, T2>
type Merge3<T1, T2, T3> = Merge<Merge<T1, T2>, T3>
type Merge4<T1, T2, T3, T4> = Merge<Merge<Merge<T1, T2>, T3>, T4>
type Merge5<T1, T2, T3, T4, T5> = Merge<Merge<Merge<Merge<T1, T2>, T3>, T4>, T5>

export type {
  DomainFunction,
  GenericRecord,
  Result,
  SchemaError,
  SuccessResult,
  ErrorResult,
  ErrorData,
  UnpackResult,
  UnpackSuccess,
  UnpackData,
  ErrorWithMessage,
  Merge2,
  Merge3,
  Merge4,
  Merge5,
}
