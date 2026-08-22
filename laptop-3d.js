import * as THREE from './vendor/three.module.min.js';

const codeLab = document.querySelector('#laboratorio');
const stage = document.querySelector('#laptopStage');
const mount = document.querySelector('#laptop3D');

if (codeLab && stage && mount) {
  try {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, .1, 50);
    const model = new THREE.Group();
    scene.add(model);

    function roundedBoxGeometry(width, height, depth, radius = .08) {
      const halfW = width / 2;
      const halfH = height / 2;
      const shape = new THREE.Shape();

      shape.moveTo(-halfW + radius, -halfH);
      shape.lineTo(halfW - radius, -halfH);
      shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + radius);
      shape.lineTo(halfW, halfH - radius);
      shape.quadraticCurveTo(halfW, halfH, halfW - radius, halfH);
      shape.lineTo(-halfW + radius, halfH);
      shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - radius);
      shape.lineTo(-halfW, -halfH + radius);
      shape.quadraticCurveTo(-halfW, -halfH, -halfW + radius, -halfH);

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        steps: 1,
        curveSegments: 7,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: Math.min(radius * .42, height * .16),
        bevelThickness: Math.min(radius * .3, depth * .18)
      });
      geometry.center();
      return geometry;
    }

    function material(color, metalness, roughness, extra = {}) {
      return new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        ...extra
      });
    }

    const aluminum = material(0x6f7771, .68, .24);
    const aluminumDark = material(0x303731, .61, .3);
    const edgeMetal = material(0x171d18, .7, .22);
    const keyMaterial = material(0x111612, .38, .32, {
      emissive: 0x152407,
      emissiveIntensity: .28
    });
    const trackpadMaterial = material(0x687069, .64, .27);
    const blackMaterial = material(0x070a08, .2, .48);
    const limeMaterial = material(0xc7ff00, .32, .25, {
      emissive: 0x6d8d00,
      emissiveIntensity: 1.35
    });

    const base = new THREE.Mesh(
      roundedBoxGeometry(5.82, .27, 3.62, .15),
      aluminum
    );
    base.position.y = 0;
    base.castShadow = true;
    base.receiveShadow = true;
    model.add(base);

    const keyboardBed = new THREE.Mesh(
      roundedBoxGeometry(4.82, .035, 1.66, .07),
      aluminumDark
    );
    keyboardBed.position.set(0, .155, -.56);
    keyboardBed.receiveShadow = true;
    model.add(keyboardBed);

    const keyGeometry = roundedBoxGeometry(.3, .075, .245, .035);
    const keys = [];
    const columns = 13;
    const rows = 5;
    const gapX = .35;
    const gapZ = .31;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if (row === rows - 1 && column >= 4 && column <= 8) continue;
        const key = new THREE.Mesh(keyGeometry, keyMaterial);
        key.position.set(
          (column - (columns - 1) / 2) * gapX,
          .205,
          -1.13 + row * gapZ
        );
        key.castShadow = true;
        key.receiveShadow = true;
        model.add(key);
        keys.push(key);
      }
    }

    const spaceBar = new THREE.Mesh(
      roundedBoxGeometry(1.67, .075, .245, .035),
      keyMaterial
    );
    spaceBar.position.set(0, .205, -1.13 + (rows - 1) * gapZ);
    spaceBar.castShadow = true;
    model.add(spaceBar);

    const legendCanvas = document.createElement('canvas');
    legendCanvas.width = 1536;
    legendCanvas.height = 512;
    const legendContext = legendCanvas.getContext('2d');
    const legendRows = [
      ['esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
      ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
      ['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
      ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '↑', 'shift'],
      ['ctrl', 'fn', 'alt', '⌘', '', '', '', '', '', '←', '↓', '→', 'ctrl']
    ];
    const legendMinX = -2.25;
    const legendMinZ = -1.25;
    const legendWorldWidth = 4.5;
    const legendWorldDepth = 1.48;

    legendContext.textAlign = 'center';
    legendContext.textBaseline = 'middle';
    legendRows.forEach((rowLabels, row) => {
      rowLabels.forEach((label, column) => {
        if (!label || (row === rows - 1 && column >= 4 && column <= 8)) return;
        const x = (column - (columns - 1) / 2) * gapX;
        const z = -1.13 + row * gapZ;
        const canvasX = ((x - legendMinX) / legendWorldWidth) * legendCanvas.width;
        const canvasY = ((z - legendMinZ) / legendWorldDepth) * legendCanvas.height;
        const fontSize = label.length >= 5 ? 20 : label.length >= 4 ? 23 : 27;
        legendContext.font = `700 ${fontSize}px Consolas, monospace`;
        legendContext.fillStyle = label === 'esc' ? '#c7ff00' : '#b9c2ba';
        legendContext.fillText(label.toUpperCase(), canvasX, canvasY);
      });
    });

    const legendTexture = new THREE.CanvasTexture(legendCanvas);
    legendTexture.colorSpace = THREE.SRGBColorSpace;
    legendTexture.minFilter = THREE.LinearFilter;
    legendTexture.magFilter = THREE.LinearFilter;
    legendTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const keyboardLegends = new THREE.Mesh(
      new THREE.PlaneGeometry(legendWorldWidth, legendWorldDepth),
      new THREE.MeshBasicMaterial({
        map: legendTexture,
        transparent: true,
        alphaTest: .04,
        depthWrite: false,
        toneMapped: false
      })
    );
    keyboardLegends.rotation.x = -Math.PI / 2;
    keyboardLegends.position.set(0, .249, -.51);
    model.add(keyboardLegends);

    function speakerTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      context.fillStyle = '#0a0e0b';
      for (let y = 14; y < canvas.height - 12; y += 18) {
        for (let x = 14; x < canvas.width - 10; x += 18) {
          context.beginPath();
          context.arc(x, y, 3.2, 0, Math.PI * 2);
          context.fill();
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    }

    const grilleMaterial = new THREE.MeshBasicMaterial({
      map: speakerTexture(),
      transparent: true,
      alphaTest: .08,
      depthWrite: false,
      toneMapped: false
    });
    [-2.62, 2.62].forEach(x => {
      const grille = new THREE.Mesh(new THREE.PlaneGeometry(.25, 1.58), grilleMaterial);
      grille.rotation.x = -Math.PI / 2;
      grille.position.set(x, .165, -.56);
      model.add(grille);
    });

    const trackpad = new THREE.Mesh(
      roundedBoxGeometry(2.18, .035, .92, .09),
      trackpadMaterial
    );
    trackpad.position.set(0, .165, 1.03);
    trackpad.receiveShadow = true;
    model.add(trackpad);

    const trackpadInset = new THREE.LineSegments(
      new THREE.EdgesGeometry(roundedBoxGeometry(2.2, .038, .94, .09)),
      new THREE.LineBasicMaterial({ color: 0xbac2ba, transparent: true, opacity: .46 })
    );
    trackpadInset.position.copy(trackpad.position);
    model.add(trackpadInset);

    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(.095, .095, 4.82, 32),
      edgeMetal
    );
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, .16, -1.76);
    hinge.castShadow = true;
    model.add(hinge);

    [-2.55, 2.55].forEach(x => {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(.11, .11, .28, 24),
        aluminumDark
      );
      cap.rotation.z = Math.PI / 2;
      cap.position.set(x, .16, -1.76);
      model.add(cap);
    });

    const sidePortGeometry = new THREE.BoxGeometry(.055, .075, .48);
    [-1, 1].forEach(side => {
      const port = new THREE.Mesh(sidePortGeometry, blackMaterial);
      port.position.set(side * 2.92, .015, -.35);
      model.add(port);
    });

    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, .16, -1.74);
    lidPivot.rotation.x = -.1;
    model.add(lidPivot);

    const lidShell = new THREE.Mesh(
      roundedBoxGeometry(5.46, 3.32, .2, .16),
      aluminumDark
    );
    lidShell.position.set(0, 1.66, 0);
    lidShell.castShadow = true;
    lidShell.receiveShadow = true;
    lidPivot.add(lidShell);

    const bezel = new THREE.Mesh(
      roundedBoxGeometry(5.14, 3.02, .045, .1),
      blackMaterial
    );
    bezel.position.set(0, 1.66, .116);
    lidPivot.add(bezel);

    const terminalCanvas = document.createElement('canvas');
    terminalCanvas.width = 1400;
    terminalCanvas.height = 820;
    const terminalContext = terminalCanvas.getContext('2d');
    const terminalTexture = new THREE.CanvasTexture(terminalCanvas);
    terminalTexture.colorSpace = THREE.SRGBColorSpace;
    terminalTexture.minFilter = THREE.LinearFilter;
    terminalTexture.magFilter = THREE.LinearFilter;
    terminalTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.82, 2.68),
      new THREE.MeshBasicMaterial({
        map: terminalTexture,
        toneMapped: false
      })
    );
    screen.position.set(0, 1.64, .166);
    screen.renderOrder = 2;
    lidPivot.add(screen);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(4.82, 2.68),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: .075,
        roughness: .08,
        metalness: 0,
        transmission: .14,
        depthWrite: false
      })
    );
    glass.position.set(0, 1.64, .174);
    glass.renderOrder = 3;
    lidPivot.add(glass);

    const cameraDot = new THREE.Mesh(
      new THREE.SphereGeometry(.027, 18, 12),
      limeMaterial
    );
    cameraDot.position.set(0, 3.205, .178);
    lidPivot.add(cameraDot);

    function labelTexture(text, width = 512, height = 180) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#c7ff00';
      context.font = '900 112px Arial Black, Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, width / 2, height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    const deckLogo = new THREE.Mesh(
      new THREE.PlaneGeometry(.58, .2),
      new THREE.MeshBasicMaterial({
        map: labelTexture('KP/'),
        transparent: true,
        toneMapped: false
      })
    );
    deckLogo.rotation.x = -Math.PI / 2;
    deckLogo.position.set(2.35, .155, 1.28);
    model.add(deckLogo);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 8),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: .43 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -.19, .25);
    ground.receiveShadow = true;
    scene.add(ground);

    const hemisphere = new THREE.HemisphereLight(0xf4fff0, 0x080b08, 1.55);
    scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-4.5, 7.5, 6.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1536, 1536);
    keyLight.shadow.camera.near = .1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    scene.add(keyLight);

    const limeLight = new THREE.PointLight(0xc7ff00, 16, 10, 2);
    limeLight.position.set(-3.5, 2.2, 3.6);
    scene.add(limeLight);

    const violetLight = new THREE.PointLight(0x8b5cff, 9, 9, 2);
    violetLight.position.set(3.7, 2.8, -1.4);
    scene.add(violetLight);

    const codeLines = [
      [
        ['from ', '#d78bff'], ['portfolio ', '#f3f5ef'],
        ['import ', '#d78bff'], ['Project', '#74d9ff']
      ],
      [
        ['app', '#74d9ff'], [' = Project(owner=', '#f3f5ef'],
        ['"Kaiqui"', '#c7ff00'], [')', '#f3f5ef']
      ],
      [
        ['app.add', '#74d9ff'], ['(skill=', '#f3f5ef'],
        ['"Python"', '#c7ff00'], [', level=', '#f3f5ef'],
        ['1', '#74d9ff'], [')', '#f3f5ef']
      ],
      [['# transformando ideias em código', '#788276']],
      [
        ['app.build', '#74d9ff'], ['(mode=', '#f3f5ef'],
        ['"always_learning"', '#c7ff00'], [')', '#f3f5ef']
      ]
    ];

    let terminalSignature = '';
    function drawTerminal(elapsed) {
      const context = terminalContext;
      const visibleLines = reduceMotion.matches
        ? codeLines.length
        : Math.min(codeLines.length, Math.floor(elapsed / 460) + 2);
      const cursorVisible = reduceMotion.matches || Math.floor(elapsed / 440) % 2 === 0;
      const signature = `${visibleLines}-${cursorVisible}`;
      if (signature === terminalSignature) return;
      terminalSignature = signature;

      const background = context.createLinearGradient(0, 0, terminalCanvas.width, terminalCanvas.height);
      background.addColorStop(0, '#050806');
      background.addColorStop(.58, '#0a100b');
      background.addColorStop(1, '#150b15');
      context.fillStyle = background;
      context.fillRect(0, 0, terminalCanvas.width, terminalCanvas.height);

      context.fillStyle = '#151b16';
      context.fillRect(0, 0, terminalCanvas.width, 92);
      context.fillStyle = '#273028';
      context.fillRect(0, 90, terminalCanvas.width, 2);

      ['#ff665c', '#f0bd45', '#c7ff00'].forEach((color, index) => {
        context.beginPath();
        context.fillStyle = color;
        context.arc(42 + index * 34, 46, 10, 0, Math.PI * 2);
        context.fill();
      });

      context.fillStyle = '#879084';
      context.font = '600 24px Consolas, monospace';
      context.textAlign = 'center';
      context.fillText('main.py — kaiqui@portfolio', terminalCanvas.width / 2, 55);
      context.textAlign = 'right';
      context.fillStyle = '#c7ff00';
      context.font = '900 31px Arial Black, sans-serif';
      context.fillText('KP/', terminalCanvas.width - 34, 58);

      context.textAlign = 'left';
      context.font = '700 42px Consolas, monospace';
      let cursorX = 86;
      let cursorY = 0;

      codeLines.slice(0, visibleLines).forEach((line, lineIndex) => {
        let x = 86;
        const y = 195 + lineIndex * 104;
        line.forEach(([text, color]) => {
          context.fillStyle = color;
          context.fillText(text, x, y);
          x += context.measureText(text).width;
        });
        if (lineIndex === codeLines.length - 1) {
          cursorX = x + 8;
          cursorY = y;
        }
      });

      if (visibleLines === codeLines.length && cursorVisible) {
        context.fillStyle = '#c7ff00';
        context.fillRect(cursorX, cursorY - 37, 17, 48);
      }

      context.save();
      context.globalAlpha = .035;
      context.fillStyle = '#c7ff00';
      context.font = '900 240px Arial Black, sans-serif';
      context.textAlign = 'right';
      context.fillText('KP/', terminalCanvas.width - 35, terminalCanvas.height - 15);
      context.restore();
      terminalTexture.needsUpdate = true;
    }

    const pointerTarget = { x: -.055, y: -.12, lift: 0 };
    const pointerCurrent = { ...pointerTarget };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(max-width: 760px), (pointer: coarse)');
    let visible = false;
    let frame = 0;
    let typingStartedAt = performance.now();
    let lidAngle = -.42;
    lidPivot.rotation.x = lidAngle;

    function resize() {
      const bounds = mount.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const compact = coarsePointer.matches;
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / bounds.height;
      camera.position.set(0, compact ? 3.85 : 3.65, compact ? 11.8 : 10.1);
      camera.lookAt(0, 1.02, 0);
      camera.updateProjectionMatrix();
      model.scale.setScalar(compact ? .84 : 1);
    }

    function render(time) {
      frame = 0;
      if (!visible) return;

      const ease = reduceMotion.matches ? 1 : .075;
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * ease;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * ease;
      pointerCurrent.lift += (pointerTarget.lift - pointerCurrent.lift) * ease;

      model.rotation.x = pointerCurrent.x;
      model.rotation.y = pointerCurrent.y;
      model.rotation.z = -.012;
      model.position.y = reduceMotion.matches ? 0 : Math.sin(time * .00135) * .055 + pointerCurrent.lift;

      const lidTarget = -.1;
      lidAngle += (lidTarget - lidAngle) * (reduceMotion.matches ? 1 : .055);
      lidPivot.rotation.x = lidAngle;

      drawTerminal(Math.max(0, time - typingStartedAt));
      renderer.render(scene, camera);
      if (!reduceMotion.matches) frame = requestAnimationFrame(render);
    }

    function startRendering() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    function stopRendering() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    mount.addEventListener('pointermove', event => {
      if (coarsePointer.matches || reduceMotion.matches) return;
      const bounds = mount.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      pointerTarget.x = -.055 - y * .19;
      pointerTarget.y = -.12 + x * .34;
      pointerTarget.lift = -.035;
    }, { passive: true });

    mount.addEventListener('pointerleave', () => {
      pointerTarget.x = -.055;
      pointerTarget.y = -.12;
      pointerTarget.lift = 0;
    });

    function updateMobilePose() {
      if (!coarsePointer.matches || reduceMotion.matches) return;
      const bounds = codeLab.getBoundingClientRect();
      const range = window.innerHeight + bounds.height;
      const progress = THREE.MathUtils.clamp((window.innerHeight - bounds.top) / range, 0, 1);
      pointerTarget.x = -.045 + progress * .055;
      pointerTarget.y = -.1 + (progress - .5) * .13;
    }

    window.addEventListener('scroll', updateMobilePose, { passive: true });
    window.addEventListener('resize', updateMobilePose, { passive: true });

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
    } else {
      window.addEventListener('resize', resize, { passive: true });
    }
    resize();
    drawTerminal(0);

    function setVisibility(isVisible) {
      visible = isVisible;
      if (visible) {
        typingStartedAt = performance.now();
        terminalSignature = '';
        lidAngle = reduceMotion.matches ? -.1 : -.42;
        updateMobilePose();
        startRendering();
      } else {
        stopRendering();
      }
    }

    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        setVisibility(entry.isIntersecting);
      }, { threshold: .08 });
      visibilityObserver.observe(stage);
    } else {
      setVisibility(true);
    }

    renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      codeLab.classList.remove('webgl-ready');
      stopRendering();
    });

    renderer.domElement.addEventListener('webglcontextrestored', () => {
      resize();
      codeLab.classList.add('webgl-ready');
      startRendering();
    });

    renderer.render(scene, camera);
    requestAnimationFrame(() => codeLab.classList.add('webgl-ready'));
  } catch (error) {
    codeLab.classList.remove('webgl-ready');
  }
}
