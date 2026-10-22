import { useEffect, useRef, useState } from "react";
import { getMascotState } from "../lib/mascot-events";
import { bearAction, createBearRig } from "../lib/bear-rig";
import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  Mesh,
  OrthographicCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function Bear3D({
  falando = false,
  gesto = "idle",
}: {
  falando?: boolean;
  gesto?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const props = useRef({ falando, gesto });
  props.current = { falando, gesto };
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      setStatus("error");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    element.appendChild(renderer.domElement);
    const scene = new Scene(),
      actor = new Group();
    scene.add(actor, new AmbientLight(0xfff6e8, 2.1));
    const key = new DirectionalLight(0xffffff, 3);
    key.position.set(2, 3, 4);
    scene.add(key);
    const fill = new DirectionalLight(0xc5e9df, 1.2);
    fill.position.set(-3, 1, 2);
    scene.add(fill);
    const camera = new OrthographicCamera(-0.68, 0.68, 0.68, -0.68, 0.1, 20);
    camera.position.set(0, 0.06, 3);
    camera.lookAt(0, 0, 0);
    let disposed = false,
      visible = true,
      raf = 0,
      previous = 0;
    let model: Group | null = null;
    let rig: ReturnType<typeof createBearRig> | null = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const gaze = { x: 0, y: 0 };
    const pointer = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      gaze.x = Math.max(
        -1,
        Math.min(1, (event.clientX - rect.left - rect.width / 2) / (window.innerWidth / 2)),
      );
      gaze.y = Math.max(
        -1,
        Math.min(1, (rect.top + rect.height / 2 - event.clientY) / (window.innerHeight / 2)),
      );
    };
    const resize = new ResizeObserver(() => {
      renderer.setSize(element.clientWidth, element.clientHeight, false);
    });
    resize.observe(element);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    visibility.observe(element);
    window.addEventListener("pointermove", pointer, { passive: true });
    function release(root: Group) {
      root.traverse((o) => {
        if (!(o as Mesh).isMesh) return;
        const mesh = o as Mesh;
        mesh.geometry.dispose();
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
          material.dispose();
        }
      });
    }
    new GLTFLoader().load(
      "/models/juju-bear.glb",
      (gltf) => {
        if (disposed) {
          release(gltf.scene);
          return;
        }
        model = gltf.scene;
        try {
          rig = createBearRig(model);
          const center = new Box3().setFromObject(model).getCenter(new Vector3());
          model.position.sub(center);
          actor.add(model);
          setStatus("ready");
        } catch {
          release(model);
          model = null;
          setStatus("error");
        }
      },
      undefined,
      () => {
        if (!disposed) setStatus("error");
      },
    );
    function frame(now: number) {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || now - previous < 32) return;
      const dt = Math.min((now - previous) / 1000 || 0.033, 0.1);
      previous = now;
      if (rig) {
        const s = getMascotState();
        let action = bearAction(s, Date.now());
        if (action === "idle" && props.current.gesto === "wave") action = "welcome";
        if (action === "idle" && props.current.gesto === "stethoscope") action = "listen";
        const time =
          action === "dance"
            ? s.musicTime + Math.min(0.5, (Date.now() - s.musicUpdatedAt) / 1000)
            : now / 1000;
        const moving = !reduced.matches;
        actor.position.y = moving
          ? action === "dance"
            ? Math.abs(Math.sin(time * Math.PI * 3.4)) * 0.035
            : Math.sin(time * 2) * 0.008
          : 0;
        actor.rotation.z = moving
          ? action === "drag"
            ? Math.max(-0.25, Math.min(0.25, s.dragVelocityX * 0.012))
            : action === "dance"
              ? Math.sin(time * Math.PI * 3.4) * 0.08
              : 0
          : 0;
        if (moving && props.current.falando) actor.position.y += Math.sin(now * 0.012) * 0.005;
        actor.scale.setScalar(
          moving && props.current.gesto === "breathe" && action === "idle"
            ? 1 + Math.sin((time * Math.PI) / 4) * 0.035
            : 1,
        );
        rig.update(action, time, dt, gaze, reduced.matches);
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointermove", pointer);
      if (model) release(model);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <span ref={host} className="bear-3d-canvas" aria-hidden="true">
      {status !== "ready" && <span className="bear-sprite" />}
      {status === "loading" && <span className="bear-3d-loading">Preparando o Juju…</span>}
    </span>
  );
}
