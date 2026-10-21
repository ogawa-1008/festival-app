import assert from "node:assert/strict";
import { test } from "node:test";

import { progressData } from "../src/data/progress.ts";
import {
  countEnoughWeaponMaterials,
  getOwnedMaterial,
  hasEnoughWeaponMaterials,
} from "../src/utils/weaponMaterials.ts";

const enough = Object.fromEntries(progressData.materials.map((material) => [material.id, material.required]));

test("記録がない素材は 0 個とみなす", () => {
  assert.equal(getOwnedMaterial({}, progressData.materials[0].id), 0);
  assert.equal(countEnoughWeaponMaterials({}), 0);
  assert.equal(hasEnoughWeaponMaterials({}), false);
});

test("すべての素材が必要数に届いたときだけ作成できる", () => {
  assert.equal(hasEnoughWeaponMaterials(enough), true);

  const [first] = progressData.materials;
  const short = { ...enough, [first.id]: first.required - 1 };
  assert.equal(countEnoughWeaponMaterials(short), progressData.materials.length - 1);
  assert.equal(hasEnoughWeaponMaterials(short), false);
});
