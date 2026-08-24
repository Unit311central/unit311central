"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Box, Grid3x3, Maximize2, RotateCcw } from "lucide-react";

import {
  isModelViewerFormat,
  isThreeJsModelFormat,
} from "@/lib/engineering-technical-files/file-types";

type TechnicalFile3DViewerProps = {
  url: string;
  extension: string;
  fileName: string;
  className?: string;
};

function ModelViewerPanel({ url, className }: { url: string; className?: string }) {
  return (
    <div className={className}>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        strategy="afterInteractive"
      />
      <model-viewer
        src={url}
        alt="3D technical model"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="0.85"
        exposure="1"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "360px",
          background:
            "radial-gradient(circle at 50% 35%, rgba(13, 148, 136, 0.12), rgba(5, 8, 22, 0.95))",
        }}
      />
    </div>
  );
}

function ThreeJsModelPanel({ url, extension, className }: { url: string; extension: string; className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let animationId = 0;

    async function load() {
      if (!mountRef.current) return;
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const ext = extension.toLowerCase();
        const width = mountRef.current.clientWidth || 640;
        const height = mountRef.current.clientHeight || 360;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0f1a);
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountRef.current.innerHTML = "";
        mountRef.current.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.75);
        const directional = new THREE.DirectionalLight(0xffffff, 0.9);
        directional.position.set(2, 4, 3);
        scene.add(ambient, directional);

        const grid = new THREE.GridHelper(200, 20, 0x1f6f68, 0x12302d);
        scene.add(grid);

        let object: import("three").Object3D;
        if (ext === "stl") {
          const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
          const loader = new STLLoader();
          const geometry = await loader.loadAsync(url);
          geometry.center();
          geometry.computeVertexNormals();
          const material = new THREE.MeshStandardMaterial({
            color: 0x5eead4,
            metalness: 0.2,
            roughness: 0.55,
          });
          object = new THREE.Mesh(geometry, material);
        } else {
          const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
          const loader = new OBJLoader();
          object = await loader.loadAsync(url);
        }

        scene.add(object);
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        camera.position.set(maxDim * 1.4, maxDim * 1.1, maxDim * 1.6);
        camera.lookAt(0, 0, 0);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const animate = () => {
          if (disposed) return;
          animationId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
          if (!mountRef.current) return;
          const w = mountRef.current.clientWidth || width;
          const h = mountRef.current.clientHeight || height;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load 3D model.");
      }
    }

    const cleanupPromise = load();
    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      void cleanupPromise;
    };
  }, [url, extension]);

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 p-8 text-sm text-slate-300 ${className ?? ""}`}>
        {error}
      </div>
    );
  }

  return <div ref={mountRef} className={`min-h-[360px] w-full overflow-hidden rounded-xl border border-white/10 ${className ?? ""}`} />;
}

export default function TechnicalFile3DViewer({
  url,
  extension,
  fileName,
  className,
}: TechnicalFile3DViewerProps) {
  const ext = extension.toLowerCase();
  const [fullscreen, setFullscreen] = useState(false);

  const panel =
    isModelViewerFormat(ext) ? (
      <ModelViewerPanel url={url} className={className} />
    ) : isThreeJsModelFormat(ext) ? (
      <ThreeJsModelPanel url={url} extension={ext} className={className} />
    ) : null;

  if (!panel) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Box className="h-4 w-4 text-teal-300" />
          <span>{fileName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Grid3x3 className="h-3.5 w-3.5" />
          Interactive 3D
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 hover:bg-white/5"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Fullscreen
          </button>
        </div>
      </div>
      {panel}
      {fullscreen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-white">{fileName}</div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" />
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1">
            {isModelViewerFormat(ext) ? (
              <ModelViewerPanel url={url} className="h-full" />
            ) : (
              <ThreeJsModelPanel url={url} extension={ext} className="h-full min-h-[70vh]" />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
