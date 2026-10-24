/* Three.js 场景：设备建模、墨水屏材质、轨道相机、屏幕拾取 */
(function () {
  "use strict";
  var THREE = window.THREE;
  var UI = window.UI;
  var Scene = {};

  var canvas, renderer, scene, camera;
  var device, screenMesh, screenTex, hitPlane, uniforms;
  var frontLight;
  var raycaster = new THREE.Raycaster();
  var ndc = new THREE.Vector2();

  var cam = { theta: 0.30, phi: 1.40, radius: 44, tTheta: 0.30, tPhi: 1.40, tRadius: 44 };
  var def = { theta: 0.30, phi: 1.40, radius: 44 };
  var baseRadius = 44;
  var intro = { on: true, t: 0, start: performance.now(), dur: 1.7, from: { theta: 0.78, phi: 1.30, radius: 60 } };
  var flashT = -1;
  var userZoom = false;
  var drag = null;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---------------------------------------------------------------- 贴图 */

  function roundRectShape(w, h, r) {
    var s = new THREE.Shape();
    var x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function makeEnvTexture() {
    var c = document.createElement("canvas");
    c.width = 1024; c.height = 512;
    var g = c.getContext("2d");
    var grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, "#8f98a4");
    grd.addColorStop(0.38, "#3d434b");
    grd.addColorStop(0.56, "#23272c");
    grd.addColorStop(1, "#08090a");
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 512);

    function blob(x, y, r, col) {
      var rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col);
      rg.addColorStop(0.55, "rgba(255,255,255,.10)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    blob(248, 108, 240, "rgba(255,255,255,.92)");
    blob(742, 84, 190, "rgba(198,216,255,.45)");
    blob(520, 268, 330, "rgba(120,132,150,.16)");
    return c;
  }

  function makeLogoTexture() {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 128;
    var g = c.getContext("2d");
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = "#ffffff";
    g.font = '500 54px "Segoe UI", Arial, Helvetica, sans-serif';
    g.textBaseline = "middle";
    var word = "kindle";
    var chars = Array.from(word);
    var track = 9;
    var total = 0;
    chars.forEach(function (ch) { total += g.measureText(ch).width + track; });
    total -= track;
    var x = (512 - total) / 2;
    chars.forEach(function (ch) {
      g.fillText(ch, x, 66);
      x += g.measureText(ch).width + track;
    });
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function makeShadowTexture() {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    var g = c.getContext("2d");
    var rg = g.createRadialGradient(256, 128, 0, 256, 128, 250);
    rg.addColorStop(0, "rgba(0,0,0,.72)");
    rg.addColorStop(0.35, "rgba(0,0,0,.42)");
    rg.addColorStop(0.7, "rgba(0,0,0,.12)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 256);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* ---------------------------------------------------------------- 着色器 */

  var vert = [
    "varying vec2 vUv;",
    "varying vec3 vN;",
    "varying vec3 vW;",
    "void main() {",
    "  vUv = uv;",
    "  vN = normalize(mat3(modelMatrix) * normal);",
    "  vec4 wp = modelMatrix * vec4(position, 1.0);",
    "  vW = wp.xyz;",
    "  gl_Position = projectionMatrix * viewMatrix * wp;",
    "}"
  ].join("\n");

  var frag = [
    "uniform sampler2D uMap;",
    "uniform float uBrightness;",
    "uniform float uWarmth;",
    "uniform float uContrast;",
    "uniform float uFlash;",
    "uniform vec2 uTexel;",
    "varying vec2 vUv;",
    "varying vec3 vN;",
    "varying vec3 vW;",
    "",
    "float hash21(vec2 p) {",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",
    "",
    "void main() {",
    "  vec2 uv = vUv;",
    "  vec3 c = texture2D(uMap, uv).rgb;",
    "  vec3 blur = texture2D(uMap, uv + vec2(uTexel.x, 0.0)).rgb",
    "            + texture2D(uMap, uv - vec2(uTexel.x, 0.0)).rgb",
    "            + texture2D(uMap, uv + vec2(0.0, uTexel.y)).rgb",
    "            + texture2D(uMap, uv - vec2(0.0, uTexel.y)).rgb;",
    "  c = mix(c, blur * 0.25, 0.16);",
    "  c = (c - 0.5) * uContrast + 0.5;",
    "  c *= uBrightness;",
    "  c *= mix(vec3(1.0), vec3(1.09, 1.005, 0.86), uWarmth);",
    "  float lum = dot(c, vec3(0.299, 0.587, 0.114));",
    "  float grain = hash21(uv * vec2(1300.0, 1800.0)) - 0.5;",
    "  c += grain * (0.024 * (1.0 - 0.45 * lum));",
    "  vec2 e = abs(uv - 0.5) * 2.0;",
    "  c *= 1.0 - smoothstep(0.82, 1.0, max(e.x, e.y)) * 0.05;",
    "  vec3 V = normalize(cameraPosition - vW);",
    "  float fres = pow(1.0 - abs(dot(V, normalize(vN))), 2.5);",
    "  c *= 1.0 - fres * 0.10;",
    "  c = mix(c, 1.0 - c, uFlash);",
    "  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);",
    "}"
  ].join("\n");

  /* ---------------------------------------------------------------- 构建 */

  function buildDevice() {
    device = new THREE.Group();
    scene.add(device);

    var bodyW = 12.6, bodyH = 17.7, bodyD = 0.62, bev = 0.09, bevSize = 0.12;

    var shape = roundRectShape(bodyW, bodyH, 1.02);
    var bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: bodyD,
      bevelEnabled: true,
      bevelThickness: bev,
      bevelSize: bevSize,
      bevelSegments: 4,
      curveSegments: 18,
      steps: 1
    });
    bodyGeo.translate(0, 0, -(bodyD / 2));
    bodyGeo.computeVertexNormals();

    var bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1c20,
      roughness: 0.58,
      metalness: 0.16,
      clearcoat: 0.28,
      clearcoatRoughness: 0.6,
      envMapIntensity: 0.85
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    device.add(body);

    // 屏幕
    var sw = 9.2, sh = 12.58;
    screenTex = new THREE.CanvasTexture(UI.canvas);
    screenTex.colorSpace = THREE.NoColorSpace;
    screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    screenTex.generateMipmaps = true;
    screenTex.minFilter = THREE.LinearMipmapLinearFilter;
    screenTex.magFilter = THREE.LinearFilter;

    uniforms = {
      uMap: { value: screenTex },
      uBrightness: { value: 1.0 },
      uWarmth: { value: 0.12 },
      uContrast: { value: 1.055 },
      uFlash: { value: 0.0 },
      uTexel: { value: new THREE.Vector2(1 / 1200, 1 / 1640) }
    };

    screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vert,
        fragmentShader: frag,
        toneMapped: false
      })
    );
    screenMesh.position.z = 0.409;
    device.add(screenMesh);

    // 玻璃层（一点点反光）
    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      new THREE.MeshPhysicalMaterial({
        color: 0x0c0e10,
        transparent: true,
        opacity: 0.13,
        roughness: 0.16,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.1,
        depthWrite: false
      })
    );
    glass.position.z = 0.418;
    glass.renderOrder = 2;
    device.add(glass);

    // 拾取面
    hitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitPlane.position.z = 0.43;
    device.add(hitPlane);

    // 品牌字
    var logo = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 0.625),
      new THREE.MeshBasicMaterial({
        map: makeLogoTexture(), transparent: true, opacity: 0.62,
        color: 0x9aa0a6, depthWrite: false
      })
    );
    logo.position.set(0, -7.33, 0.413);
    device.add(logo);

    // 底部 ／ 侧面的一点细节：电源键
    var btn = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.16, 0.34),
      new THREE.MeshPhysicalMaterial({ color: 0x23262a, roughness: 0.5, metalness: 0.3 })
    );
    btn.position.set(4.1, -8.9, 0.02);
    btn.rotation.x = 0.06;
    device.add(btn);

    // 影子
    var shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 8.5),
      new THREE.MeshBasicMaterial({
        map: makeShadowTexture(), transparent: true, opacity: 0.5,
        depthWrite: false, color: 0x000000
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.5, -9.32, 0.25);
    scene.add(shadow);
  }

  /* ---------------------------------------------------------------- 初始化 */

  Scene.init = function () {
    canvas = document.getElementById("gl");
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.4, 200);

    var pmrem = new THREE.PMREMGenerator(renderer);
    var envTex = new THREE.CanvasTexture(makeEnvTexture());
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    var envRT = pmrem.fromEquirectangular(envTex);
    scene.environment = envRT.texture;
    envTex.dispose();
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xb9c9dd, 0x0a0b0c, 0.5));
    var key = new THREE.DirectionalLight(0xfff6e8, 2.3);
    key.position.set(9, 17, 15);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x9db6da, 1.0);
    rim.position.set(-13, 5, -9);
    scene.add(rim);
    frontLight = new THREE.PointLight(0xffd7a3, 0.5, 9, 2);
    frontLight.position.set(0, 0, 4.5);
    scene.add(frontLight);

    buildDevice();
    resize();
    window.addEventListener("resize", resize);
    bindPointer();
    Scene.setLight(UI.settings.brightness, UI.settings.warmth);
    updateCamera(true);
    UI.portTries = 0;
  };

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    var vf = Math.tan(THREE.MathUtils.degToRad(28 / 2));
    var dv = (17.7 / 0.86) / (2 * vf);
    var dh = (12.6 / 0.92) / (2 * vf * camera.aspect);
    baseRadius = Math.max(dv, dh);
    baseRadius = clamp(baseRadius, 28, 92);
    def.radius = baseRadius;
    if (!userZoom) {
      cam.tRadius = baseRadius;
      if (!cam.radius) cam.radius = baseRadius;
    }
  }

  /* ---------------------------------------------------------------- 相机 */

  function updateCamera(instant) {
    if (intro.on && !instant) {
      // handled in tick
    }
    var sp = cam;
    var x = sp.radius * Math.sin(sp.phi) * Math.sin(sp.theta);
    var y = sp.radius * Math.cos(sp.phi) + 0.35;
    var z = sp.radius * Math.sin(sp.phi) * Math.cos(sp.theta);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0.15, 0);
  }

  function hitTest(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    var hits = raycaster.intersectObject(hitPlane, false);
    if (!hits.length) return null;
    var uv = hits[0].uv;
    if (!uv) return null;
    return { x: uv.x * 1024, y: (1 - uv.y) * 1400 };
  }

  /* ---------------------------------------------------------------- 指针 */

  function bindPointer() {
    canvas.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      var p = hitTest(e.clientX, e.clientY);
      drag = {
        mode: p ? "screen" : "orbit",
        sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY,
        p: p, moved: false, grabbed: false, longFired: false
      };
      if (p) {
        drag.grabbed = UI.pointerDown(p.x, p.y);
        if (!drag.grabbed) drag.mode = "maybe";
        drag.longTimer = setTimeout(function () {
          if (drag && !drag.moved) {
            UI.pointerLongPress(drag.p.x, drag.p.y);
            drag.longFired = true;
            drag.moved = true;
          }
        }, 560);
      } else {
        intro.on = false;
        userZoom = true;
      }
      canvas.classList.add("grabbing");
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });

    window.addEventListener("pointermove", function (e) {
      if (!drag) {
        if (e.target === canvas) {
          var h = hitTest(e.clientX, e.clientY);
          canvas.style.cursor = h ? "pointer" : "grab";
        }
        return;
      }
      var dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
      drag.lx = e.clientX; drag.ly = e.clientY;
      if (Math.abs(e.clientX - drag.sx) > 8 || Math.abs(e.clientY - drag.sy) > 8) {
        drag.moved = true;
        clearTimeout(drag.longTimer);
      }

      if (drag.mode === "screen") {
        var h2 = hitTest(e.clientX, e.clientY);
        if (h2) drag.p = h2;
        UI.pointerMove(drag.p.x, drag.p.y);
      } else if (drag.mode === "maybe") {
        UI.pointerMove(drag.p.x, drag.p.y);
        if (drag.moved) {
          drag.mode = "orbit";
          UI.cancelPress();
          intro.on = false;
          userZoom = true;
        }
      } else if (drag.mode === "orbit") {
        cam.tTheta = clamp(cam.tTheta - dx * 0.0055, -0.95, 0.95);
        cam.tPhi = clamp(cam.tPhi - dy * 0.0046, 1.00, 1.74);
        intro.on = false;
      }
    });

    window.addEventListener("pointerup", function (e) {
      if (!drag) return;
      clearTimeout(drag.longTimer);
      if (drag.mode === "screen") {
        UI.pointerUp(drag.p.x, drag.p.y);
      } else if (drag.mode === "maybe" && !drag.moved) {
        UI.pointerUp(drag.p.x, drag.p.y);
      }
      canvas.classList.remove("grabbing");
      if (e.target === canvas) {
        var h = hitTest(e.clientX, e.clientY);
        canvas.style.cursor = h ? "pointer" : "grab";
      } else {
        canvas.style.cursor = "grab";
      }
      drag = null;
    });

    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      var h = hitTest(e.clientX, e.clientY);
      if (h && UI.wheel(h.x, h.y, e.deltaY * 0.55)) return;
      var k = Math.sign(e.deltaY) * 0.065;
      cam.tRadius = clamp(cam.tRadius * (1 + k), 22, 90);
      cam.radius = cam.radius || baseRadius;
      userZoom = true;
      intro.on = false;
    }, { passive: false });
  }

  /* ---------------------------------------------------------------- 状态 */

  Scene.setLight = function (brightness, warmth) {
    if (!uniforms) return;
    uniforms.uBrightness.value = brightness;
    uniforms.uWarmth.value = warmth;
    if (frontLight) {
      var warm = new THREE.Color().setHSL(0.09 - warmth * 0.035, 0.42 + warmth * 0.25, 0.62);
      frontLight.color.copy(warm);
      frontLight.intensity = Math.max(0, (brightness - 0.55)) * 3.4;
    }
  };

  Scene.flash = function () {
    if (!uniforms) return;
    flashT = 0;
  };

  Scene.focus = function () {
    intro.on = false;
    cam.tTheta = 0;
    cam.tPhi = Math.PI / 2;
    cam.tRadius = Math.max(24, baseRadius * 0.70);
    userZoom = true;
  };

  Scene.reset = function () {
    intro.on = false;
    cam.tTheta = def.theta;
    cam.tPhi = def.phi;
    cam.tRadius = baseRadius;
    userZoom = false;
  };

  Scene.isFocused = function () {
    return Math.abs(cam.tTheta) < 0.01 && Math.abs(cam.tPhi - Math.PI / 2) < 0.01 && cam.tRadius < baseRadius * 0.9;
  };

  /* ---------------------------------------------------------------- 循环 */

  Scene.start = function (onFrame) {
    var last = performance.now();

    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (intro.on) {
        var k = Math.min(1, (now - intro.start) / (intro.dur * 1000));
        intro.t = k * intro.dur;
        var e = 1 - Math.pow(1 - k, 4);
        cam.theta = intro.from.theta + (def.theta - intro.from.theta) * e;
        cam.phi = intro.from.phi + (def.phi - intro.from.phi) * e;
        cam.radius = intro.from.radius + (baseRadius - intro.from.radius) * e;
        cam.tTheta = cam.theta; cam.tPhi = cam.phi; cam.tRadius = cam.radius;
        if (k >= 1) intro.on = false;
      } else {
        var d = Math.min(1, dt * 9);
        cam.theta += (cam.tTheta - cam.theta) * d;
        cam.phi += (cam.tPhi - cam.phi) * d;
        cam.radius += (cam.tRadius - cam.radius) * d;
      }
      updateCamera();

      if (onFrame) onFrame(dt);

      if (UI.dirty) {
        UI.draw();
        if (screenTex) screenTex.needsUpdate = true;
      }

      if (flashT >= 0) {
        flashT += dt;
        var v = 0;
        if (flashT < 0.085) v = 0.94;
        else if (flashT < 0.2) v = 0.94 * (1 - (flashT - 0.085) / 0.115);
        else { v = 0; flashT = -1; }
        if (uniforms) uniforms.uFlash.value = v;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };

  Scene.screenPoint = hitTest;
  Scene._debug = {
    get camera() { return camera; }, get device() { return device; },
    get renderer() { return renderer; }, get uniforms() { return uniforms; }
  };
  window.Scene = Scene;
})();
