export interface SuspectSeed {
  name: string
  gender: 'f' | 'm'
}

/** Enough distinct identities to cover an "experto" (12x12) puzzle without repeats,
 * and to make regenerating the same difficulty not feel identical run to run. */
export const SUSPECT_POOL: SuspectSeed[] = [
  { name: 'Nora', gender: 'f' },
  { name: 'Delia', gender: 'f' },
  { name: 'Priya', gender: 'f' },
  { name: 'Marcus', gender: 'm' },
  { name: 'Teo', gender: 'm' },
  { name: 'Astrid', gender: 'f' },
  { name: 'Bruno', gender: 'm' },
  { name: 'Celia', gender: 'f' },
  { name: 'Darío', gender: 'm' },
  { name: 'Elena', gender: 'f' },
  { name: 'Fabio', gender: 'm' },
  { name: 'Ingrid', gender: 'f' },
  { name: 'Julián', gender: 'm' },
  { name: 'Karim', gender: 'm' },
  { name: 'Lucía', gender: 'f' },
  { name: 'Marco', gender: 'm' },
  { name: 'Nadia', gender: 'f' },
  { name: 'Otto', gender: 'm' },
  { name: 'Paula', gender: 'f' },
  { name: 'Quique', gender: 'm' },
  { name: 'Rosa', gender: 'f' },
  { name: 'Simón', gender: 'm' },
  { name: 'Tania', gender: 'f' },
  { name: 'Ulises', gender: 'm' },
  { name: 'Vera', gender: 'f' },
  { name: 'Walter', gender: 'm' },
  { name: 'Ximena', gender: 'f' },
  { name: 'Yago', gender: 'm' },
  { name: 'Zoe', gender: 'f' },
  { name: 'Adrián', gender: 'm' },
]
