import test from "ava";
import classno from "./";

test("classno", (t) => {
  t.deepEqual(classno``, undefined);
  t.deepEqual(classno`${"a"}\n\tcolor red`, "a");
});
