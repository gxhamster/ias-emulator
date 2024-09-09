import assert from "assert";
import {Machine} from "../index.js"

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
      const vm = new  Machine();
      assert.equal(vm.memory.length, 1024);
    });
  });
});