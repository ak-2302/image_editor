import { useState } from "react";
import type {
  InitialEffectKey,
  InitialEffectValues,
} from "../../components/initial-effects/effectTypes";

export const defaultObjectTransform: InitialEffectValues = {
  x: 0,
  y: 0,
  scale: 100,
  rotation: 0,
  opacity: 0,
};

export function useObjectTransforms() {
  const [currentObjectId, setCurrentObjectId] = useState("main");
  const [values, setValues] = useState<InitialEffectValues>(
    defaultObjectTransform,
  );
  const [valuesByObject, setValuesByObject] = useState<
    Record<string, InitialEffectValues>
  >({ main: defaultObjectTransform });

  const update = (key: InitialEffectKey, value: number) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      setValuesByObject((objects) => ({
        ...objects,
        [currentObjectId]: next,
      }));
      return next;
    });
  };

  const select = (
    previousObjectId: string,
    nextObjectId: string,
    currentValues: InitialEffectValues,
  ) => {
    const nextValues = valuesByObject[nextObjectId] ?? defaultObjectTransform;
    setValuesByObject((objects) => ({
      ...objects,
      [previousObjectId]: currentValues,
    }));
    setCurrentObjectId(nextObjectId);
    setValues(nextValues);
    return nextValues;
  };

  const setForObject = (objectId: string, nextValues: InitialEffectValues) => {
    setValuesByObject((objects) => ({ ...objects, [objectId]: nextValues }));
    if (objectId === currentObjectId) setValues(nextValues);
  };

  const setAll = (
    nextValuesByObject: Record<string, InitialEffectValues>,
    objectId: string,
  ) => {
    setValuesByObject(nextValuesByObject);
    setCurrentObjectId(objectId);
    setValues(nextValuesByObject[objectId] ?? defaultObjectTransform);
  };

  return { values, valuesByObject, update, select, setForObject, setAll };
}
