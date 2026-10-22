import { Bone, Euler, Object3D, Quaternion, Vector3 } from "three";
import type { MascotState } from "./mascot-events";
import { danceMotion } from "./bear-dance";

export type BearAction = "idle" | "welcome" | "applause" | "thinking" | "dance" | "drag" | "listen";
export function bearAction(s: MascotState, now: number): BearAction {
  if (s.dragging) return "drag";
  if (s.applauseAt > 0 && now - s.applauseAt < 4500) return "applause";
  if (s.thinking) return "thinking";
  if (s.welcomeAt > 0 && now - s.welcomeAt < 7000) return "welcome";
  return s.musicPlaying ? "dance" : "idle";
}

/** World-space two-bone IK: independent of the uploaded rig's unusual local bone axes. */
function aim(bone: Object3D, child: Object3D, target: Vector3) {
  const origin = bone.getWorldPosition(new Vector3());
  const from = child.getWorldPosition(new Vector3()).sub(origin).normalize();
  const to = target.clone().sub(origin).normalize();
  const world = bone.getWorldQuaternion(new Quaternion());
  const delta = new Quaternion().setFromUnitVectors(from, to);
  const parent = bone.parent?.getWorldQuaternion(new Quaternion()) ?? new Quaternion();
  bone.quaternion.copy(parent.invert().multiply(delta).multiply(world));
  bone.updateWorldMatrix(false, true);
}

function solve(upper: Bone, lower: Bone, hand: Bone, target: Vector3, pole: Vector3) {
  const origin = upper.getWorldPosition(new Vector3());
  const elbow = lower.getWorldPosition(new Vector3());
  const wrist = hand.getWorldPosition(new Vector3());
  const a = origin.distanceTo(elbow),
    b = elbow.distanceTo(wrist);
  const direction = target.clone().sub(origin);
  const distance = Math.max(Math.abs(a - b) + 0.001, Math.min(direction.length(), a + b - 0.001));
  direction.normalize();
  const bend = pole.clone().sub(origin);
  bend.addScaledVector(direction, -bend.dot(direction)).normalize();
  const along = (a * a - b * b + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, a * a - along * along));
  const desiredElbow = origin
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(bend, height);
  aim(upper, lower, desiredElbow);
  aim(lower, hand, origin.addScaledVector(direction, distance));
}

function worldRotate(object: Object3D, x: number, y: number, z = 0) {
  const world = object.getWorldQuaternion(new Quaternion());
  const parent = object.parent?.getWorldQuaternion(new Quaternion()) ?? new Quaternion();
  object.quaternion.copy(
    parent
      .invert()
      .multiply(new Quaternion().setFromEuler(new Euler(x, y, z)))
      .multiply(world),
  );
  object.updateWorldMatrix(false, true);
}

export function createBearRig(model: Object3D) {
  const bones = new Map<string, Bone>();
  const rests = new Map<Object3D, Quaternion>();
  const eyes: Object3D[] = [];
  model.traverse((object) => {
    if ((object as Bone).isBone) {
      bones.set(object.name.replace(/[^a-z0-9]/gi, "").replace(/^mixamorig/i, ""), object as Bone);
      rests.set(object, object.quaternion.clone());
    }
    if (/^JujuEye(Left|Right)$/.test(object.name)) {
      eyes.push(object);
      rests.set(object, object.quaternion.clone());
    }
  });
  const required = [
    "LeftArm",
    "LeftForeArm",
    "LeftHand",
    "RightArm",
    "RightForeArm",
    "RightHand",
    "Head",
  ];
  if (required.some((name) => !bones.has(name)))
    throw new Error("O modelo não contém as articulações esperadas.");
  const left = new Vector3(0.25, 0.4, 0.04),
    right = new Vector3(-0.25, 0.4, 0.04);
  let tilt = 0,
    turn = 0;
  return {
    update(
      action: BearAction,
      time: number,
      dt: number,
      gaze: { x: number; y: number },
      reduced: boolean,
    ) {
      rests.forEach((q, bone) => bone.quaternion.copy(q));
      model.updateWorldMatrix(true, true);
      const wave = reduced ? 0 : Math.sin(time * 5);
      const { sway: beat } = danceMotion(time, reduced);
      const l = new Vector3(0.25, 0.39, 0.04),
        r = new Vector3(-0.25, 0.39, 0.04);
      let pitch = gaze.y * -0.06,
        yaw = gaze.x * 0.12;
      if (action === "thinking") {
        r.set(-0.075, 0.69, 0.12);
        l.set(0.22, 0.4, 0.07);
        pitch = -0.2;
        yaw = -0.12;
      }
      if (action === "listen") {
        l.set(0.11, 0.51, 0.15);
        r.set(-0.22, 0.4, 0.07);
        pitch = 0.12;
        yaw = -0.14;
      }
      if (action === "applause") {
        const spread = reduced ? 0.06 : 0.045 + (0.09 * (1 + Math.sin(time * 13))) / 2;
        l.set(spread, 0.57, 0.115);
        r.set(-spread, 0.57, 0.115);
      }
      if (action === "welcome") {
        l.set(0.24 + wave * 0.025, 0.82, 0.03);
        r.set(-0.22, 0.77 + wave * 0.03, 0.04);
      }
      if (action === "drag") {
        l.set(0.2, 0.96, 0.015);
        r.set(-0.2, 0.96, 0.015);
        pitch = -0.12;
      }
      if (action === "dance") {
        // Keep both elbows almost straight and sweep the open arms together.
        // The uploaded rig has different left/right arm lengths.
        for (const [side, target] of [
          ["Left", l],
          ["Right", r],
        ] as const) {
          const upper = bones.get(side + "Arm")!;
          const lower = bones.get(side + "ForeArm")!;
          const hand = bones.get(side + "Hand")!;
          const shoulder = model.worldToLocal(upper.getWorldPosition(new Vector3()));
          const elbow = model.worldToLocal(lower.getWorldPosition(new Vector3()));
          const wrist = model.worldToLocal(hand.getWorldPosition(new Vector3()));
          const reach = (shoulder.distanceTo(elbow) + elbow.distanceTo(wrist)) * 0.995;
          const angle = (side === "Left" ? 1.15 : -1.15) + beat * 0.55;
          const direction = new Vector3(
            Math.sin(angle),
            0.1 + beat * 0.1,
            Math.cos(angle),
          ).normalize();
          target.copy(shoulder).addScaledVector(direction, reach);
        }
        yaw = -beat * 0.12;
      }
      const blend = reduced ? 1 : 1 - Math.exp(-dt * 12);
      // Do not shorten the reach by interpolating dance targets across an arc.
      if (action === "dance") {
        left.copy(l);
        right.copy(r);
      } else {
        left.lerp(l, blend);
        right.lerp(r, blend);
      }
      tilt += (pitch - tilt) * blend;
      turn += (yaw - turn) * blend;
      worldRotate(bones.get("Head")!, tilt, turn);
      for (const [side, target] of [
        ["Left", left],
        ["Right", right],
      ] as const) {
        const sign = side === "Left" ? 1 : -1;
        solve(
          bones.get(side + "Arm")!,
          bones.get(side + "ForeArm")!,
          bones.get(side + "Hand")!,
          model.localToWorld(target.clone()),
          model.localToWorld(new Vector3(sign * 0.55, 0.42, 0.2)),
        );
        const leg = bones.get(side + "UpLeg"),
          knee = bones.get(side + "Leg"),
          foot = bones.get(side + "Foot");
        if (leg && knee && foot)
          solve(
            leg,
            knee,
            foot,
            model.localToWorld(
              new Vector3(
                sign * 0.16,
                0.06 + (action === "dance" ? Math.max(0, sign * beat) * 0.025 : 0),
                0.015,
              ),
            ),
            model.localToWorld(new Vector3(sign * 0.2, 0.15, 0.5)),
          );
      }
      // Separate eye pivots added to the original textured head, preserving the uploaded bear.
      for (const eye of eyes)
        worldRotate(eye, action === "thinking" ? -0.3 : -gaze.y * 0.32, gaze.x * 0.4);
      model.updateWorldMatrix(true, true);
    },
  };
}
