import { describe, expect, it } from 'vitest'
import type { Cell, FurnitureType } from '../types/puzzle'
import { furniturePieces, isBesideFurniture, multiCellFurniturePlacements, pieceShape } from './gridLogic'

function gridOf(furnitureByKey: Record<string, FurnitureType>) {
  const cells: Cell[] = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      cells.push({ row, col, roomId: 'room-0', furniture: furnitureByKey[`${row}-${col}`] })
    }
  }
  return { cells }
}

describe('furniturePieces', () => {
  it('returns no pieces when nothing is furnished', () => {
    expect(furniturePieces(gridOf({}))).toEqual([])
  })

  it('groups a single-cell type into a 1-cell piece', () => {
    const pieces = furniturePieces(gridOf({ '1-1': 'chair' }))
    expect(pieces).toEqual([{ type: 'chair', cells: [{ row: 1, col: 1 }], minRow: 1, maxRow: 1, minCol: 1, maxCol: 1 }])
  })

  it('groups a straight 2-cell rug regardless of orientation', () => {
    const horizontal = furniturePieces(gridOf({ '1-1': 'rug', '1-2': 'rug' }))[0]
    expect(horizontal).toMatchObject({ minRow: 1, maxRow: 1, minCol: 1, maxCol: 2 })

    const vertical = furniturePieces(gridOf({ '1-1': 'rug', '2-1': 'rug' }))[0]
    expect(vertical).toMatchObject({ minRow: 1, maxRow: 2, minCol: 1, maxCol: 1 })
  })

  it('keeps different types as separate pieces even when adjacent', () => {
    const pieces = furniturePieces(gridOf({ '1-1': 'rug', '1-2': 'sofa' }))
    expect(pieces).toHaveLength(2)
  })

  it.each([
    [{ '1-1': 'sofa', '1-2': 'sofa', '2-1': 'sofa' }, 'bottomRight'], // missing (2,2)
    [{ '1-1': 'sofa', '1-2': 'sofa', '2-2': 'sofa' }, 'bottomLeft'], // missing (2,1)
    [{ '1-1': 'sofa', '2-1': 'sofa', '2-2': 'sofa' }, 'topRight'], // missing (1,2)
    [{ '1-2': 'sofa', '2-1': 'sofa', '2-2': 'sofa' }, 'topLeft'], // missing (1,1)
  ])('finds the missing corner of a 3-cell L piece', (furnitureByKey, missingCorner) => {
    const piece = furniturePieces(gridOf(furnitureByKey as Record<string, FurnitureType>))[0]
    expect(piece.missingCorner).toBe(missingCorner)
  })

  it('leaves missingCorner unset for a straight 3-cell piece (the screen has no 2x2 box)', () => {
    const horizontal = furniturePieces(gridOf({ '1-1': 'screen', '1-2': 'screen', '1-3': 'screen' }))[0]
    expect(horizontal.missingCorner).toBeUndefined()

    const vertical = furniturePieces(gridOf({ '1-1': 'screen', '2-1': 'screen', '3-1': 'screen' }))[0]
    expect(vertical.missingCorner).toBeUndefined()
  })
})

describe('isBesideFurniture', () => {
  // cols 0-1 are room A, cols 2-3 are room B. Furniture sits at (1,1).
  const cellAt = (row: number, col: number): Cell => ({ row, col, roomId: col <= 1 ? 'A' : 'B' })
  const furniture = cellAt(1, 1)

  it('is true on the furniture cell itself', () => {
    expect(isBesideFurniture(cellAt(1, 1), furniture)).toBe(true)
  })

  it('is true one orthogonal step away within the same room', () => {
    expect(isBesideFurniture(cellAt(0, 1), furniture)).toBe(true)
    expect(isBesideFurniture(cellAt(1, 0), furniture)).toBe(true)
  })

  it('is false for a cell orthogonally adjacent but in the neighbouring room', () => {
    expect(isBesideFurniture(cellAt(1, 2), furniture)).toBe(false)
  })

  it('is false for a same-room cell that is two steps away', () => {
    expect(isBesideFurniture(cellAt(0, 0), furniture)).toBe(false)
  })
})

describe('pieceShape', () => {
  it('is "single" for a 1-cell piece', () => {
    const piece = furniturePieces(gridOf({ '1-1': 'chair' }))[0]
    expect(pieceShape(piece)).toBe('single')
  })

  it('is "h2"/"v2" for a straight 2-cell piece', () => {
    const h = furniturePieces(gridOf({ '1-1': 'rug', '1-2': 'rug' }))[0]
    expect(pieceShape(h)).toBe('h2')

    const v = furniturePieces(gridOf({ '1-1': 'rug', '2-1': 'rug' }))[0]
    expect(pieceShape(v)).toBe('v2')
  })

  it('is "L" for an L-shaped 3-cell piece', () => {
    const piece = furniturePieces(gridOf({ '1-1': 'sofa', '1-2': 'sofa', '2-1': 'sofa' }))[0]
    expect(pieceShape(piece)).toBe('L')
  })

  it('is "h3"/"v3" for a straight 3-cell piece', () => {
    const h = furniturePieces(gridOf({ '1-1': 'screen', '1-2': 'screen', '1-3': 'screen' }))[0]
    expect(pieceShape(h)).toBe('h3')

    const v = furniturePieces(gridOf({ '1-1': 'screen', '2-1': 'screen', '3-1': 'screen' }))[0]
    expect(pieceShape(v)).toBe('v3')
  })
})

describe('multiCellFurniturePlacements', () => {
  it('excludes 1-cell pieces — those render as a normal per-cell icon instead', () => {
    expect(multiCellFurniturePlacements(gridOf({ '1-1': 'chair' }))).toEqual([])
  })

  it('spans the correct grid lines for a straight 2-cell piece', () => {
    const [horizontal] = multiCellFurniturePlacements(gridOf({ '1-1': 'rug', '1-2': 'rug' }))
    expect(horizontal).toMatchObject({ gridColumn: '2 / 4', gridRow: '2 / 3' })

    const [vertical] = multiCellFurniturePlacements(gridOf({ '1-1': 'rug', '2-1': 'rug' }))
    expect(vertical).toMatchObject({ gridColumn: '2 / 3', gridRow: '2 / 4' })
  })

  it('spans the full 2x2 bounding box for an L-shaped 3-cell piece', () => {
    const [piece] = multiCellFurniturePlacements(gridOf({ '1-1': 'sofa', '1-2': 'sofa', '2-1': 'sofa' }))
    expect(piece).toMatchObject({ gridColumn: '2 / 4', gridRow: '2 / 4' })
  })

  it('carries the missing corner through for an L-shaped piece, for BoardGrid.vue to pick the matching sprite', () => {
    const [piece] = multiCellFurniturePlacements(gridOf({ '1-1': 'sofa', '1-2': 'sofa', '2-1': 'sofa' }))
    expect(piece.shape).toBe('L')
    expect(piece.missingCorner).toBe('bottomRight')
  })

  it('spans the full 1x3 run for a straight 3-cell piece', () => {
    const [horizontal] = multiCellFurniturePlacements(gridOf({ '1-1': 'screen', '1-2': 'screen', '1-3': 'screen' }))
    expect(horizontal).toMatchObject({ shape: 'h3', gridColumn: '2 / 5', gridRow: '2 / 3' })

    const [vertical] = multiCellFurniturePlacements(gridOf({ '1-1': 'screen', '2-1': 'screen', '3-1': 'screen' }))
    expect(vertical).toMatchObject({ shape: 'v3', gridColumn: '2 / 3', gridRow: '2 / 5' })
  })

  /**
   * Regression test: an earlier version hid a multi-cell piece entirely whenever a
   * suspect was on any of its cells, so a 2-3 cell rug/sofa vanished completely just
   * because the player was trying a guess on one cell of it — much worse than a
   * single-cell icon being partly covered by a face. The fix is architectural, not a
   * conditional that could regress on its own: this function's signature has no
   * `Placements` parameter at all, so its output cannot depend on suspect occupancy —
   * every cell of every multi-cell piece is always present. See
   * docs/visual-design.md for the longer story and BoardGrid.vue for how the
   * placed-suspect layer is drawn *on top of* these overlays instead of replacing them.
   */
  it('always includes every cell of a multi-cell piece, with no way to hide any of them', () => {
    const twoCell = multiCellFurniturePlacements(gridOf({ '1-1': 'rug', '1-2': 'rug' }))[0]
    expect(twoCell.cells).toHaveLength(2)

    const threeCell = multiCellFurniturePlacements(gridOf({ '1-1': 'sofa', '1-2': 'sofa', '2-1': 'sofa' }))[0]
    expect(threeCell.cells).toHaveLength(3)
  })
})
