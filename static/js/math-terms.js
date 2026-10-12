/* Symbol-level explanations for the manuscript notation. Original TeX and MathML
 * stay intact; only the visual KaTeX layer receives semantic hit targets. */
(() => {
  'use strict';
  const entries = {};
  function term(id, tex, title, description, related = [], variants = {}) {
    entries[id] = {id, tex, title, description, related, ...variants};
  }
  term('position', String.raw`p`, 'Vehicle position', 'The true planar position of the vehicle, p = (x, y). The vision-based controller receives an estimate of this position.', ['estimate', 'position-rate', 'chart']);
  term('position-rate', String.raw`\dot p`, 'Position derivative', 'The dot denotes differentiation with respect to continuous time. This is the vehicle’s planar velocity. For the nonholonomic plant it equals the signed speed times the heading; for the holonomic plant it equals the planar input.', ['position', 'speed', 'input']);
  term('estimate', String.raw`\hat p`, 'Estimated position', 'The calibrated position estimate supplied by the perception policy. It satisfies the interface p̂ = p + eσ. The hat distinguishes the estimate from the true physical position.', ['position', 'error', 'policy']);
  term('estimate-k', String.raw`\hat p_k`, 'Position estimate at image update k', 'The estimate after processing image update k. One selected observation updates it; if none is selected, the predicted position is retained. Here k indexes images.', ['estimate', 'memory', 'misses']);
  term('source', String.raw`p^\star`, 'Source location', 'The unique maximizer of the signal field in the nonholonomic analysis, and the chosen source location in the illustrations. The controller uses online field measurements rather than the analytic field gradient.', ['source-set', 'field']);
  term('obstacle-center', String.raw`p_{\mathcal O}`, 'Obstacle center', 'The center of the ball enclosing the obstacle. Clearance and radial direction are computed relative to this fixed point.', ['radius', 'direction', 'obstacle']);
  term('field', 'J', 'Signal field', 'The unknown scalar field whose maximizer the vehicle seeks. Its analytic expression and gradient are not required by the proposed feedback law.', ['measurement', 'source-set']);
  term('measurement', String.raw`\hat J`, 'Measured signal intensity', 'An online scalar field measurement at the vehicle’s current physical location. This hat denotes a measured signal value; it is distinct from the position estimate delivered by the camera.', ['field', 'estimate', 'potential']);
  term('manifold-measurement', String.raw`\hat J_{\mathcal M}`, 'Signal measurement in manifold coordinates', 'The online source-field evaluation expressed using z = φ(p). It is the source-seeking term in the manifold potential, with a minus sign so that minimizing the potential favors stronger signal.', ['measurement', 'chart', 'potential']);
  term('potential', String.raw`V_q`, 'Active localization function', 'The localization function associated with the current controller mode q. It combines source seeking and obstacle-aware terms and enters both feedback and switching.', ['q', 'safety-barrier', 'angular', 'gap'], {
    holonomic: {description:'In the holonomic controller, Vq(p) = −Ĵ(p) + B(dq(p)) inside the covering region Uq, and +∞ outside it. It combines the measured signal with the mode-domain barrier.', related:['q','measurement','barrier','mode-distance']},
    nonholonomic: {description:'In the nonholonomic controller, Vq(z) = −ĴM(z) + Bsafety(eρ) + Ψq(ϑ). Its three terms represent the measured signal, radial safety barrier, and mode-dependent angular correction.', related:['q','manifold-measurement','safety-barrier','angular']}
  });
  term('candidate-potential', String.raw`V_r`, 'Competing mode potential', 'The localization value for a candidate mode r. The minimum over r ∈ {1, 2} is compared with the active value Vq to decide whether switching offers enough decrease.', ['potential', 'candidate-mode', 'gap']);
  term('initial-potential', 'V_0', 'Initial potential used by the illustration', 'The smaller of the two initial localization values. The interactive holonomic illustration uses this value to choose its fixed oscillation frequency and initial oscillator phase for the placed layout.', ['potential', 'omega', 'a']);
  term('q', 'q', 'Active controller mode', 'The discrete mode q ∈ {1, 2} selects the active localization function. Hybrid switching changes q; this is separate from CAP’s choice of perception expert.', ['potential', 'gap', 'q-next', 'policy']);
  term('q-next', 'q^+', 'Mode after a jump', 'The superscript + means the value immediately after a hybrid jump. The jump selects a mode attaining the minimum potential; the physical position and oscillator states do not jump.', ['q', 'candidate-potential', 'threshold']);
  term('candidate-mode', 'r', 'Candidate mode index', 'In a minimization over r ∈ Q, r is a candidate controller mode. It takes the values 1 or 2; it does not represent a geometric distance here.', ['q', 'candidate-potential']);
  term('radial-distance', 'r', 'Distance from the obstacle center', 'In this geometry diagram, r = ‖p − pO‖ is the radial distance. Subtracting d⋆ gives the clearance used by the logarithmic chart.', ['obstacle-center', 'radius', 'clearance']);
  term('gap', String.raw`\Gamma_i`, 'Switching gap', 'The active potential minus the smallest candidate potential, evaluated at the estimated state. It measures the decrease available by changing modes. The label i identifies the holonomic or nonholonomic design.', ['potential', 'candidate-potential', 'threshold', 'estimated-state']);
  term('threshold', String.raw`\delta_i`, 'Hysteresis threshold', 'A positive switching threshold. Flow is allowed when the gap is at most δ; a jump is allowed when it is at least δ. The analysis chooses δ below the positive synergistic gap. At equality, both flow and jump are permitted.', ['gap', 'q-next']);
  term('heading', String.raw`\psi`, 'Vehicle heading', 'The unit heading vector ψ = [cos α, sin α]ᵀ. A nonholonomic vehicle translates only along this direction, with signed speed u₁. The obstacle-relative direction ϑ is a different vector.', ['alpha', 'speed', 'direction']);
  term('heading-rate', String.raw`\dot\psi`, 'Heading derivative', 'The time derivative of the unit heading: ψ̇ = u₂ Sψ. Multiplication by S gives the direction perpendicular to ψ, so this equation rotates the heading.', ['heading', 'turn-rate', 'rotation']);
  term('alpha', String.raw`\alpha`, 'Heading angle', 'The angle parameterizing the heading vector. The angular input u₂ is its time derivative, so the original nonholonomic law rotates the heading continuously.', ['heading', 'turn-rate']);
  term('alpha-rate', String.raw`\dot\alpha`, 'Angular velocity', 'The time derivative of the heading angle. For this nonholonomic controller it equals u₂ = 2π√ω.', ['alpha', 'turn-rate', 'omega']);
  term('speed', 'u_1', 'Signed translational speed', 'The oscillatory input multiplying the heading in ṗ = u₁ψ. Positive values move along ψ and negative values move backward along the same heading. Reversing translation does not flip the vehicle’s orientation.', ['heading', 'eta', 'potential', 'turn-rate']);
  term('turn-rate', 'u_2', 'Angular input', 'The nonholonomic law sets u₂ = 2π√ω. This rotates the vehicle heading continuously. Its rate differs from the internal oscillator rate 2πω.', ['heading-rate', 'eta-rate', 'omega']);
  term('input', 'u', 'Planar velocity input', 'The holonomic plant obeys ṗ = u with u ∈ ℝ². The feedback combines the active localization function and the periodic exploration vector to command planar translation.', ['position-rate', 'feedback', 'mu']);
  term('rotation', 'S', 'Quarter-turn matrix', 'The skew-symmetric matrix [[0, −1], [1, 0]] rotates a planar vector counterclockwise by 90°. Its matrix exponential exp(θS) represents rotation through angle θ.', ['heading-rate', 'eta-rate', 'angular-map']);
  term('eta', String.raw`\eta`, 'Internal nonholonomic oscillator', 'A unit vector on the circle evolving at angular rate 2πω. It modulates the translational input. This oscillator is separate from the physical vehicle heading ψ.', ['eta-rate', 'speed', 'heading']);
  term('eta-rate', String.raw`\dot\eta`, 'Internal oscillator dynamics', 'The dot is a time derivative. The law η̇ = 2πωSη rotates η with period 1/ω in model time. The heading instead rotates at 2π√ω.', ['eta', 'turn-rate', 'omega']);
  term('e1', 'e_1', 'First coordinate vector', 'The unit vector e₁ = (1, 0)ᵀ. The matrix exponential rotates this reference vector according to the active potential before taking its inner product with η.', ['rotation', 'potential', 'eta']);
  term('omega', String.raw`\omega`, 'Oscillation parameter', 'A positive parameter controlling the time scales of oscillatory exploration. Its role differs between the holonomic and nonholonomic laws.', ['eta', 'mu', 'turn-rate'], {
    nonholonomic:{description:'The internal oscillator has angular rate 2πω, the heading has rate 2π√ω, and the translational input amplitude scales as √ω for fixed γ and κ. These distinct time scales produce the averaged source-seeking motion.',related:['eta-rate','turn-rate','gamma','kappa']},
    holonomic:{description:'The angular frequency of the holonomic oscillator μ̇ = ωSμ. Its period is 2π/ω. The same parameter appears in the exploration velocity aωSμ.',related:['mu-rate','a','gain']}
  });
  term('gamma', String.raw`\gamma`, 'Nonholonomic gain', 'A positive control parameter in the input amplitude √(4πγω/κ). After oscillator and heading averaging, it appears in the descent factor γ/2. Changing it alters the dynamics, not only the plotted line.', ['speed', 'omega', 'kappa']);
  term('kappa', String.raw`\kappa`, 'Potential-to-phase scaling', 'A positive parameter multiplying Vq in the rotation exp(−κVqS). It sets the phase sensitivity to the potential and also enters the input amplitude through 1/√κ.', ['potential', 'speed', 'gamma']);
  term('mu', String.raw`\mu`, 'Holonomic exploration vector', 'A periodic unit vector used to explore the signal field without gradient measurements. It evolves under μ̇ = ωSμ and enters the planar feedback input.', ['mu-rate', 'a', 'feedback']);
  term('mu-rate', String.raw`\dot\mu`, 'Holonomic oscillator dynamics', 'The time derivative μ̇ = ωSμ rotates the unit exploration vector with angular frequency ω. This is an internal oscillator rather than a prescribed body orientation.', ['mu', 'omega', 'rotation']);
  term('a', 'a', 'Holonomic exploration amplitude', 'A positive dither-amplitude parameter. The analysis uses the slow-coordinate relation p̃ = p − aμ. The feedback contains both aωSμ and a potential-dependent term proportional to 1/a.', ['mu', 'omega', 'gain']);
  term('gain', 'k', 'Holonomic feedback gain', 'The positive gain in the holonomic input term −(2k/a)Vqμ. In the nominal averaged system it multiplies the descent direction −∇Vq. Here k is a gain, not the image-update index used in CAP.', ['a', 'potential', 'input']);
  term('feedback', String.raw`\mathcal F_q`, 'Mode-dependent feedback matrix', 'The holonomic feedback matrix Fq(p) = −aωS + (2k/a)Vq(p)I. The input is u = −Fq(p̂)μ, with position estimated by perception.', ['potential', 'a', 'gain', 'mu']);
  term('z', 'z', 'Manifold state', 'The obstacle-relative coordinates z = (ρ, ϑ) = φ(p). They encode logarithmic radial clearance and the unit direction from the obstacle center to the vehicle.', ['chart', 'rho', 'direction']);
  term('z-hat', String.raw`\hat z`, 'Estimated manifold state', 'The chart applied to the estimated physical position: ẑ = φ(p̂). The controller uses this estimate in its nonholonomic feedback and switching logic.', ['estimate', 'chart', 'z']);
  term('chart', String.raw`\varphi`, 'Obstacle-relative coordinate map', 'The chart maps positions outside the clearance disk to ℝ × S¹: its first coordinate is log(‖p − pO‖ − d⋆), and its second is (p − pO)/‖p − pO‖.', ['rho', 'direction', 'radius']);
  term('rho', String.raw`\rho`, 'Logarithmic clearance', 'The nonholonomic radial coordinate ρ = log(‖p − pO‖ − d⋆). Thus eρ is the positive clearance from the excluded disk boundary.', ['clearance', 'radius', 'chart'], {
    holonomic:{title:'Holonomic covering-radius parameter',description:'In the holonomic construction, ρ > dₒ determines the size of the excluded diamond ‖p − pO‖₁ ≤ ρ√2. Here ρ is a geometric parameter, not a logarithmic coordinate.',related:['region','obstacle-center','rho-b']}
  });
  term('rho-hat', String.raw`\hat\rho`, 'Estimated logarithmic clearance', 'The logarithm of ‖p̂ − pO‖ − d⋆. It is defined only when the estimated position lies outside the excluded clearance disk.', ['z-hat', 'estimate', 'rho']);
  term('direction', String.raw`\vartheta`, 'Obstacle-relative direction', 'The unit vector (p − pO)/‖p − pO‖ pointing from the obstacle center to the vehicle. It describes location around the obstacle, not the vehicle’s heading.', ['heading', 'obstacle-center', 'angular']);
  term('direction-hat', String.raw`\hat\vartheta`, 'Estimated obstacle-relative direction', 'The unit direction formed from p̂ − pO. It is the angular component of the estimated manifold state.', ['direction', 'z-hat']);
  term('direction-source', String.raw`\vartheta^\star`, 'Source direction', 'The unit direction from the obstacle center toward the source p⋆. The potential analysis uses alignment of the fixed reference direction with this source direction.', ['source', 'reference']);
  term('reference', String.raw`\vartheta_{\mathrm{ref}}`, 'Fixed reference direction', 'The presumed source-side direction used to construct the angular terms. It is fixed design information. The manuscript’s potential analysis assumes it equals the source direction ϑ⋆.', ['direction-source', 'angular', 'angular-map']);
  term('angular', String.raw`\Psi_q`, 'Mode-dependent angular term', 'The nonnegative correction Ψq(ϑ) = 1 − ⟨ϑref, Φq(ϑ)⟩. Its dependence on q provides complementary localization functions for the hybrid design.', ['angular-map', 'reference', 'q', 'potential']);
  term('angular-map', String.raw`\Phi_q`, 'Mode-dependent direction transformation', 'The matrix exponential rotates ϑ through the angle (3/2 − q)(1 − ⟨ϑref, ϑ⟩). Modes 1 and 2 use opposite signs for the factor 3/2 − q.', ['rotation', 'reference', 'direction', 'angular']);
  term('radius', String.raw`d^\star`, 'Excluded-disk radius', 'The nonholonomic chart excludes the disk centered at pO with radius d⋆, enclosing the physical obstacle. The quantity ‖p − pO‖ − d⋆ must be positive.', ['clearance', 'obstacle', 'chart']);
  term('clearance', String.raw`e^\rho`, 'Radial clearance', 'The positive distance ‖p − pO‖ − d⋆ from the excluded disk boundary. It is the argument of the radial safety barrier. It differs from the perception error eσ.', ['rho', 'radius', 'safety-barrier', 'error']);
  term('safety-barrier', String.raw`B_{\mathrm{safety}}`, 'Radial safety barrier', 'This nonnegative term penalizes small radial clearance. It equals (ρₒ − s)² log(ρₒ/s) for 0 < s ≤ ρₒ, vanishes for s > ρₒ, and diverges as clearance s tends to zero.', ['clearance', 'rho-o', 'potential']);
  term('rho-o', String.raw`\rho_o`, 'Radial barrier range', 'A positive clearance threshold for the nonholonomic safety barrier. The barrier is zero above this threshold; the construction chooses it small enough to vanish near the source.', ['safety-barrier', 'clearance']);
  term('barrier', 'B', 'Holonomic domain barrier', 'The scalar barrier applied to the distance dq from the active covering-region boundary. It grows without bound as this distance tends to zero and vanishes beyond ρb.', ['mode-distance', 'rho-b', 'region']);
  term('barrier-argument', 's', 'Barrier argument', 'A positive clearance variable in the scalar barrier profile. For the nonholonomic controller it is eρ; for the holonomic controller it is the mode-domain distance dq.', ['clearance', 'mode-distance']);
  term('rho-b', String.raw`\rho_b`, 'Holonomic barrier range', 'The positive threshold beyond which the holonomic barrier is zero. It is chosen below the source set’s clearance from the boundary of the overlap U₁ ∩ U₂.', ['barrier', 'region', 'source-set']);
  term('mode-distance', 'd_q', 'Distance to the active domain boundary', 'The Euclidean distance from p to the complement of Uq. It is positive inside the active holonomic covering region and is the argument of its barrier.', ['region', 'barrier', 'potential']);
  term('region', String.raw`\mathcal U_q`, 'Holonomic covering region', 'One of the two open regions covering the exterior of the excluded diamond. The active mode’s potential is finite only in its own region. The source set lies in their common overlap.', ['q', 'mode-distance', 'hol-safe']);
  term('policy', String.raw`\sigma`, 'Perception policy', 'The index specifying how camera observations and causal internal state produce a position estimate. It is separate from the hybrid controller mode q.', ['estimator', 'memory', 'q']);
  term('estimator', String.raw`\ell_\sigma`, 'Learned estimation map', 'The perception policy’s map from the current observation and causal memory to the estimated vehicle position. CAP is a causal realization of this interface.', ['observation', 'memory', 'estimate']);
  term('observation', String.raw`\theta`, 'Sensory observation', 'The current camera image, modeled as θ = h(p). This θ represents sensory data, not the heading angle α or the obstacle-relative direction ϑ.', ['observation-map', 'alpha', 'direction']);
  term('observation-map', 'h', 'Observation map', 'The map from vehicle position to sensory observations, such as an RGB camera image. The learned estimation map processes its output.', ['observation', 'estimator']);
  term('memory', String.raw`\zeta_\sigma`, 'Causal perception memory', 'The internal state of the perception policy, containing information from past and current observations: for example tracking history, innovations, miss counts, or scheduling state.', ['policy', 'estimator', 'misses']);
  term('error', String.raw`e_\sigma`, 'Position-estimation error', 'The residual p̂ − p in calibrated coordinates. It perturbs both continuous feedback and the hybrid switching decisions.', ['estimate', 'error-bound', 'empirical-error']);
  term('error-bound', String.raw`\bar e_\sigma`, 'Assumed perception-error bound', 'A worst-case bound on ‖p̂ − p‖ over a compact operating region. This is an assumption used in the robustness analysis, not the empirical error estimate used by the CAP gate.', ['error', 'operating-region', 'empirical-error']);
  term('operating-region', 'K', 'Compact operating region', 'A compact region on which the perception error is bounded and the local robustness analysis is applied. The relevant operating neighborhoods have positive clearance from excluded boundaries.', ['error-bound', 'safe']);
  term('calibration', 'M', 'Calibration matrix', 'A nonsingular 2 × 2 matrix relating physical and estimated coordinates. After applying its inverse as a coordinate transformation, the calibrated interface uses M = I.', ['identity', 'estimate', 'error']);
  term('identity', 'I', 'Identity matrix', 'The identity matrix leaves a vector unchanged. Here it is two-dimensional, as in the calibrated perception interface M = I or the holonomic feedback matrix.', ['calibration', 'feedback']);
  term('empirical-error', String.raw`\hat\epsilon_k`, 'Estimated localization error', 'The empirical error model’s estimate for the local candidate at image update k. CAP compares it with 0.8 times the current controller tolerance. It is distinct from the assumed worst-case bound ēσ.', ['tolerance', 'error-bound', 'presence']);
  term('tolerance', String.raw`r_k^{\mathrm{ctrl}}`, 'Controller localization tolerance', 'The admissible localization error at image update k, computed as the minimum of the domain, switching, and phase tolerances. CAP escalates to full-frame when the estimated error exceeds 0.8 times this value, or after at least two consecutive misses.', ['domain-tolerance', 'switch-tolerance', 'phase-tolerance', 'empirical-error']);
  term('domain-tolerance', String.raw`r_{\mathrm D,k}`, 'Domain tolerance', 'The tolerance component accounting for the region in which the active controller mode is defined. It participates in the minimum defining the controller tolerance.', ['tolerance', 'region']);
  term('switch-tolerance', String.raw`r_{\mathrm S,k}`, 'Switching tolerance', 'The tolerance component accounting for sensitivity of mode selection near a switching boundary. It participates in the minimum defining the controller tolerance.', ['tolerance', 'gap', 'q']);
  term('phase-tolerance', String.raw`r_{\mathrm P,k}`, 'Phase tolerance', 'The tolerance component accounting for position-induced phase variation in the oscillatory control input. It participates in the minimum defining the controller tolerance.', ['tolerance', 'potential', 'kappa']);
  term('misses', 'm_k', 'Consecutive-miss count', 'The number of consecutive preceding image updates without an observation used to update the position estimate. CAP requests full-frame processing at mₖ ≥ 2; an accepted observation resets the count.', ['estimate-k', 'empirical-error']);
  term('presence', String.raw`\pi_{\mathrm{local},k}`, 'Local presence probability', 'The estimated probability that the vehicle is present in the local search region. When the full-frame condition is false, values below 0.5 request the Context Expert; otherwise the local observation is retained.', ['empirical-error', 'misses', 'tolerance']);
  term('source-set', String.raw`\mathcal A_J`, 'Source set', 'The set of global maximizers of J over the workspace. Safe source seeking aims to approach this set while avoiding obstacles.', ['field', 'source', 'safe']);
  term('obstacle', String.raw`\mathcal O`, 'Physical obstacle region', 'The compact region occupied by the obstacle. The geometric constructions exclude a larger region to provide clearance from the physical obstacle.', ['obstacle-center', 'radius', 'safe']);
  term('workspace', String.raw`\mathcal W`, 'Workspace', 'The planar region on which the signal field and source-seeking problem are defined. Removing the obstacle gives the physical obstacle-free set.', ['safe', 'obstacle', 'field']);
  term('safe', String.raw`\mathcal X_{\mathrm{safe}}`, 'Physical obstacle-free set', 'The workspace with the obstacle region removed: Xsafe = W ∖ O. The controller-specific operating regions impose additional geometric restrictions.', ['workspace', 'hol-safe', 'nh-safe']);
  term('hol-safe', String.raw`\mathcal X_{\mathrm{hol}}`, 'Holonomic operating region', 'The workspace intersected with the union U₁ ∪ U₂, outside the excluded diamond. This region is a subset of the physical obstacle-free set.', ['region', 'safe', 'rho']);
  term('nh-safe', String.raw`\mathcal W^\star`, 'Nonholonomic admissible workspace', 'The exterior of the closed disk centered at pO with radius d⋆. The logarithmic chart is defined on this open exterior.', ['radius', 'chart', 'safe']);
  term('modes', String.raw`\mathcal Q`, 'Set of controller modes', 'The finite set {1, 2}. The active mode q and candidate mode r belong to this set.', ['q', 'candidate-mode']);
  term('manifold', String.raw`\mathcal M`, 'Obstacle-relative state space', 'The product ℝ × S¹. Its first coordinate represents logarithmic clearance, and its second is the unit radial direction around the obstacle.', ['z', 'rho', 'circle']);
  term('circle', String.raw`\mathbb S^1`, 'Unit circle', 'The set of two-dimensional vectors with Euclidean norm one. The heading ψ, radial direction ϑ, and oscillator states lie on this circle, but represent different quantities.', ['heading', 'direction', 'eta', 'mu']);
  term('plane', String.raw`\mathbb R^2`, 'Euclidean plane', 'The two-dimensional real coordinate space used for physical position, planar velocity, and position-estimation error.', ['position', 'input', 'error']);
  term('real', String.raw`\mathbb R`, 'Real line', 'The set of real numbers. In the manifold ℝ × S¹, the real coordinate is logarithmic clearance.', ['manifold', 'rho']);
  term('ball', String.raw`\mathbb B`, 'Closed unit ball', 'The closed unit ball centered at the origin. Translating and scaling it constructs the obstacle-enclosing and excluded disks.', ['radius', 'obstacle-center']);
  term('estimated-state', String.raw`\hat\xi`, 'Estimated state used for switching', 'A common notation for p̂ in the holonomic controller and ẑ in the nonholonomic controller. The switching gap is evaluated at this estimated state.', ['estimate', 'z-hat', 'gap']);
  term('hybrid-state', String.raw`\chi`, 'Full hybrid state', 'The full continuous and discrete controller–plant state: (p, q, μ) for the holonomic design and (z, ψ, q, η) for the nonholonomic design.', ['target', 'time', 'jump-index']);
  term('target', String.raw`\mathcal A`, 'Full-state target set', 'The target used in the practical-stability estimate. It combines the source set with all admissible mode and oscillator states, so convergence concerns source seeking rather than a fixed oscillator phase.', ['source-set', 'hybrid-state', 'residual']);
  term('target-hol', String.raw`\mathcal A_{\mathrm{hol}}`, 'Holonomic target set', 'The product AJ × Q × S¹. Position approaches the source set while the mode and unit exploration vector remain free within their state spaces.', ['source-set', 'q', 'mu']);
  term('target-nh', String.raw`\mathcal A_{\mathrm{noh}}`, 'Nonholonomic target set', 'The product φ(AJ) × S¹ × Q × S¹. It constrains the manifold position to the source image, while allowing heading, mode, and oscillator phase to vary.', ['source-set', 'z', 'heading', 'eta']);
  term('decay', String.raw`\beta`, 'Class-KL decay bound', 'The function bounding the transient distance to the target: it increases with initial distance and decreases to zero as hybrid time grows. The practical residual ν is added separately.', ['kl', 'residual', 'target']);
  term('kl', String.raw`\mathcal{KL}`, 'Class-KL functions', 'Functions that are continuous, strictly increasing from zero in their first argument and decay to zero with their second argument. They express stability together with convergence.', ['decay', 'time', 'jump-index']);
  term('residual', String.raw`\nu`, 'Practical convergence residual', 'The prescribed positive residual in the stability estimate. The result gives convergence to a neighborhood of the source set under the stated sequential parameter choices, rather than exact convergence for fixed finite-frequency settings.', ['decay', 'error-bound', 'omega']);
  term('time', 't', 'Continuous time', 'The continuous-time coordinate of a solution. In a hybrid trajectory (t, j), t measures flow time and j counts jumps. Playback speed and archived time scaling are separate display choices.', ['jump-index', 'model-time']);
  term('jump-index', 'j', 'Hybrid jump index', 'The nonnegative integer counting discrete jumps. The stability estimate uses hybrid time t + j to account for both continuous flows and discrete mode changes.', ['time', 'q-next', 'hybrid-state']);
  term('model-time', String.raw`\tau`, 'Controller model time in these replay notes', 'In the archived replay scaling shown here, the recorded simulation time is tₛ = 80τ. These notes use τ for controller model time; it should not be confused with the fast-time rescaling used in the averaging proof.', ['time', 'omega']);
  term('minimum-clearance', String.raw`c_{\min}`, 'Minimum monitored domain clearance', 'The smallest monitored distance to the boundary of the region in which the controller is defined, over the indicated trials. It is not automatically the distance from the vehicle body to the physical rock.', ['hol-safe', 'nh-safe']);
  term('design-index', 'i', 'Controller design label', 'The subscript i identifies the design: hol for the holonomic controller or noh for the nonholonomic controller. It is distinct from the active mode q within either design.', ['q', 'gap', 'threshold']);
  term('exponential', 'e', 'Exponential', 'In the nonholonomic input, exp(−κVqS) is a matrix exponential representing a planar rotation. In eρ, the scalar exponential converts logarithmic clearance back to positive radial clearance.', ['rotation', 'potential', 'clearance']);
  term('pi', String.raw`\pi`, 'Circle constant', 'The mathematical constant π ≈ 3.14159. A factor 2π converts a cycle count to an angle in radians. This is distinct from the subscripted local presence probability.', ['omega', 'presence']);
  term('inner-product', String.raw`\langle\cdot,\cdot\rangle`, 'Euclidean inner product', 'The sum of products of corresponding vector components. For two unit vectors it equals the cosine of their angle. The nonholonomic input uses it to project a potential-dependent rotated reference onto the internal oscillator.', ['speed', 'e1', 'eta', 'rotation']);
  term('infinity', String.raw`\infty`, 'Infinite localization value', 'For the holonomic potentials, +∞ marks a mode whose covering region does not contain the queried position. Such an active mode is excluded from flow and must switch to an admissible mode.', ['potential', 'region', 'q-next']);
  term('x', 'x', 'Horizontal position coordinate', 'The first component of the physical planar position p = (x, y).', ['position', 'y']);
  term('y', 'y', 'Vertical position coordinate', 'The second component of the physical planar position p = (x, y).', ['position', 'x']);

  // Match complete atoms first, including their hats/dots and subscripts. Never
  // rewrite command names, prose, alignment environment names, or operators.
  const aliases = {
    'position':['p'], 'position-rate':[String.raw`\dot p`], 'estimate':[String.raw`\hat p`], 'estimate-k':[String.raw`\hat p_k`],
    'source':[String.raw`p^\star`], 'obstacle-center':[String.raw`p_{\mathcal O}`], 'field':['J'], 'measurement':[String.raw`\hat J`], 'manifold-measurement':[String.raw`\hat J_{\mathcal M}`],
    'potential':['V_q'],'candidate-potential':['V_r'],'initial-potential':['V_0'],'q':['q'],'q-next':['q^+'],'candidate-mode':['r'],
    'gap':[String.raw`\Gamma_i`,String.raw`\Gamma_{\mathrm{noh}}`,String.raw`\Gamma_{\mathrm{hol}}`],
    'threshold':[String.raw`\delta_i`,String.raw`\delta_{\mathrm{noh}}`,String.raw`\delta_{\mathrm{hol}}`,String.raw`\delta`],
    'heading':[String.raw`\psi`], 'heading-rate':[String.raw`\dot\psi`], 'alpha':[String.raw`\alpha`], 'alpha-rate':[String.raw`\dot\alpha`],
    'speed':['u_1'],'turn-rate':['u_2'],'input':['u'],'rotation':['S'],'eta':[String.raw`\eta`],'eta-rate':[String.raw`\dot\eta`],'e1':['e_1'],
    'omega':[String.raw`\omega`],'gamma':[String.raw`\gamma`],'kappa':[String.raw`\kappa`],'mu':[String.raw`\mu`],'mu-rate':[String.raw`\dot\mu`],'a':['a'],'gain':['k'],'feedback':[String.raw`\mathcal F_q`],
    'z':['z'],'z-hat':[String.raw`\hat z`],'chart':[String.raw`\varphi`],'rho':[String.raw`\rho`],'rho-hat':[String.raw`\hat\rho`],
    'direction':[String.raw`\vartheta`],'direction-hat':[String.raw`\hat\vartheta`],'direction-source':[String.raw`\vartheta^\star`],'reference':[String.raw`\vartheta_{\mathrm{ref}}`],
    'angular':[String.raw`\Psi_q`],'angular-map':[String.raw`\Phi_q`],'radius':[String.raw`d^\star`],'clearance':[String.raw`e^\rho`,'c'],
    'safety-barrier':[String.raw`B_{\mathrm{safety}}`],'rho-o':[String.raw`\rho_o`],'barrier':['B'],'barrier-argument':['s'],'rho-b':[String.raw`\rho_b`],'mode-distance':['d_q'],
    'region':[String.raw`\mathcal U_q`,String.raw`\mathcal U_1`,String.raw`\mathcal U_2`],
    'policy':[String.raw`\sigma`],'estimator':[String.raw`\ell_\sigma`],'observation':[String.raw`\theta`],'observation-map':['h'],'memory':[String.raw`\zeta_\sigma`],
    'error':[String.raw`e_\sigma`],'error-bound':[String.raw`\bar e_\sigma`],'operating-region':['K'],'calibration':['M'],'identity':['I'],
    'empirical-error':[String.raw`\hat\epsilon_k`],'tolerance':[String.raw`r_k^{\mathrm{ctrl}}`],'domain-tolerance':[String.raw`r_{\mathrm D,k}`],'switch-tolerance':[String.raw`r_{\mathrm S,k}`],'phase-tolerance':[String.raw`r_{\mathrm P,k}`],
    'misses':['m_k'],'presence':[String.raw`\pi_{\mathrm{local},k}`],
    'source-set':[String.raw`\mathcal A_J`],'obstacle':[String.raw`\mathcal O`],'workspace':[String.raw`\mathcal W`],'safe':[String.raw`\mathcal X_{\mathrm{safe}}`],'hol-safe':[String.raw`\mathcal X_{\mathrm{hol}}`],'nh-safe':[String.raw`\mathcal W^\star`],
    'modes':[String.raw`\mathcal Q`],'manifold':[String.raw`\mathcal M`],'circle':[String.raw`\mathbb S^1`],'plane':[String.raw`\mathbb R^2`],'real':[String.raw`\mathbb R`],'ball':[String.raw`\mathbb B`],
    'estimated-state':[String.raw`\hat\xi`],'hybrid-state':[String.raw`\chi`],'target':[String.raw`\mathcal A`],'target-hol':[String.raw`\mathcal A_{\mathrm{hol}}`],'target-nh':[String.raw`\mathcal A_{\mathrm{noh}}`],
    'decay':[String.raw`\beta`],'kl':[String.raw`\mathcal{KL}`],'residual':[String.raw`\nu`],'time':['t'],'jump-index':['j'],'model-time':[String.raw`\tau`],'minimum-clearance':[String.raw`c_{\min}`],'design-index':['i'],'exponential':['e'],'pi':[String.raw`\pi`],'inner-product':[String.raw`\langle\cdot,\cdot\rangle`],'infinity':[String.raw`\infty`],'x':['x'],'y':['y']
  };
  const patterns = Object.entries(aliases).flatMap(([id,list])=>list.map(tex=>({id,tex,compact:tex.replace(/\s/g,'')}))).sort((a,b)=>b.compact.length-a.compact.length);
  function annotate(tex, context='general') {
    const index=[],compact=Array.from(tex).filter((ch,i)=>{if(/\s/.test(ch))return false;index.push(i);return true;}).join('');
    let result='',i=0,serial=0;
    const skipGroup=(start)=>{let depth=0,k=start;for(;k<tex.length;k++){if(tex[k]==='{')depth++;if(tex[k]==='}'&&--depth===0){k++;break;}}return k;};
    while(i<tex.length){
      const ci=index.indexOf(i);
      const match=ci<0?null:patterns.find(p=>compact.startsWith(p.compact,ci)&&!(/^\\[A-Za-z]+$/.test(p.compact)&&/[A-Za-z]/.test(tex[index[ci+p.compact.length-1]+1]||'')));
      if(match){
        const end=index[ci+match.compact.length-1]+1,raw=tex.slice(i,end);
        const id=match.id==='candidate-mode'&&context==='geometry'?'radial-distance':match.id;
        result+=`{\\htmlData{term=${id},term-index=${serial++}}{${raw}}}`;i=end;continue;
      }
      if(tex[i]==='\\'){
        const command=/^\\(?:[A-Za-z]+|.)/.exec(tex.slice(i))?.[0]||'\\';
        let end=i+command.length;
        if(/^\\(?:begin|end|text|mathrm|mathcal|mathbb|operatorname)$/.test(command)){
          if(tex[end]==='*')end++;while(/\s/.test(tex[end]||'')&&end<tex.length)end++;
          if(tex[end]==='{')end=skipGroup(end);
        }
        result+=tex.slice(i,end);i=end;continue;
      }
      result+=tex[i++];
    }
    return result;
  }
  function describe(id,context='general'){
    const entry=entries[id];return entry?{...entry,...(entry[context==='geometry'?'nonholonomic':context]||{})}:null;
  }
  const api={annotate,describe,entries};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window==='undefined')return;
  window.CAPMathTerms=api;
  const katex=window.katex;
  let popup,anchor,pinned=false,hideTimer,hoverTimer,activeRoot,origin,sequence=0,pointerActive=false;
  const contexts={nonholonomic:'Nonholonomic control',holonomic:'Holonomic control',geometry:'Obstacle geometry',cap:'Adaptive perception',general:'Manuscript notation'};
  function contextFor(node,tex){
    const model=node.closest('[data-model-details]')?.dataset.modelDetails;
    if(model)return model;
    if(node.closest('#guide-nonholonomic-geometry'))return 'geometry';
    if(node.closest('#holonomic-formulation,#paper-holonomic,#guide-holonomic-loop'))return 'holonomic';
    if(node.closest('#nonholonomic-formulation,#paper-nonholonomic,#guide-nonholonomic-loop,.replay-method-note,#s0-scene,#videos'))return 'nonholonomic';
    if(node.closest('#cap-routing-formulation,#guide-cap-architecture'))return 'cap';
    if(/\\mu|\\mathcal F_q|\\rho_b/.test(tex))return 'holonomic';
    if(/\\eta|u_1|\\vartheta|\\rho_o|\\hat z/.test(tex))return 'nonholonomic';
    return 'general';
  }
  function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function math(e,tex){katex.render(tex,e,{throwOnError:true,strict:'error',trust:false});}
  // Explanation prose uses the same typesetter for accented and indexed symbols.
  const proseSymbols={
    'p̂':String.raw`\hat p`,'ṗ':String.raw`\dot p`,'p̃':String.raw`\tilde p`,'ψ̇':String.raw`\dot\psi`,'η̇':String.raw`\dot\eta`,'μ̇':String.raw`\dot\mu`,
    '2π√ω':String.raw`2\pi\sqrt\omega`,'2π/ω':String.raw`2\pi/\omega`,'2πω':String.raw`2\pi\omega`,'1/√κ':String.raw`1/\sqrt\kappa`,'√ω':String.raw`\sqrt\omega`,
    '√(4πγω/κ)':String.raw`\sqrt{4\pi\gamma\omega/\kappa}`,'−(2k/a)Vqμ':String.raw`-(2k/a)V_q\mu`,'−∇Vq':String.raw`-\nabla V_q`,'aωSμ':String.raw`a\omega S\mu`,
    'ĴM':String.raw`\hat J_{\mathcal M}`,'Bsafety':String.raw`B_{\mathrm{safety}}`,'ϑref':String.raw`\vartheta_{\mathrm{ref}}`,'ϑ⋆':String.raw`\vartheta^\star`,
    'Vq':String.raw`V_q`,'Vr':String.raw`V_r`,'Fq':String.raw`\mathcal F_q`,'Ψq':String.raw`\Psi_q`,'Φq':String.raw`\Phi_q`,'dq':String.raw`d_q`,
    'pO':String.raw`p_{\mathcal O}`,'p⋆':String.raw`p^\star`,'d⋆':String.raw`d^\star`,'ρₒ':String.raw`\rho_o`,'ρb':String.raw`\rho_b`,'dₒ':String.raw`d_o`,
    'eρ':String.raw`e^\rho`,'eσ':String.raw`e_\sigma`,'ēσ':String.raw`\bar e_\sigma`,'u₁':String.raw`u_1`,'u₂':String.raw`u_2`,'e₁':String.raw`e_1`,'mₖ':String.raw`m_k`,
    'U₁':String.raw`\mathcal U_1`,'U₂':String.raw`\mathcal U_2`,'Uq':String.raw`\mathcal U_q`,'AJ':String.raw`\mathcal A_J`,'Xsafe':String.raw`\mathcal X_{\mathrm{safe}}`,
    'ℝ²':String.raw`\mathbb R^2`,'S¹':String.raw`\mathbb S^1`,'ℝ':String.raw`\mathbb R`,'ẑ':String.raw`\hat z`,'tₛ':String.raw`t_s`,'Ĵ':String.raw`\hat J`
  };
  const prosePattern=new RegExp(Object.keys(proseSymbols).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
  function explanation(text){
    const e=make('p','math-term-description');let start=0;
    for(const m of text.matchAll(prosePattern)){e.append(document.createTextNode(text.slice(start,m.index)));const glyph=make('span');math(glyph,proseSymbols[m[0]]);e.append(glyph);start=m.index+m[0].length;}
    e.append(document.createTextNode(text.slice(start)));return e;
  }
  function ensurePopup(){
    if(popup)return;
    popup=make('aside','math-term-popover');popup.hidden=true;popup.id='math-term-popover';popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');popup.setAttribute('aria-labelledby','math-term-title');
    popup.addEventListener('pointerenter',()=>clearTimeout(hideTimer));popup.addEventListener('pointerleave',()=>delayHide());
    document.body.append(popup);
  }
  function close(restore=false){
    clearTimeout(hideTimer);clearTimeout(hoverTimer);
    if(anchor)anchor.setAttribute('aria-expanded','false');
    document.querySelectorAll('.math-term-active').forEach(e=>e.classList.remove('math-term-active'));
    if(popup)popup.hidden=true;
    const last=origin;anchor=null;activeRoot=null;pinned=false;
    if(restore&&last?.isConnected){pointerActive=true;last.focus({preventScroll:true});}
  }
  function delayHide(){if(!pinned){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!popup?.matches(':hover')&&!anchor?.matches(':hover,:focus'))close();},240);}}
  function position(){
    if(!popup||popup.hidden||!anchor)return;
    if(!anchor.isConnected||anchor.getBoundingClientRect().width===0){close();return;}
    const r=anchor.getBoundingClientRect(),gap=12,pad=14,w=popup.offsetWidth,h=popup.offsetHeight,ww=document.documentElement.clientWidth,vh=window.innerHeight;
    let left=Math.min(Math.max(pad,r.left+r.width/2-w/2),ww-w-pad);
    let top=r.bottom+gap;
    if(top+h>vh-pad){
      if(r.top-h-gap>=pad)top=r.top-h-gap;
      else if(r.right+gap+w<=ww-pad){left=r.right+gap;top=Math.max(pad,Math.min(r.top-20,vh-h-pad));}
      else if(r.left-gap-w>=pad){left=r.left-gap-w;top=Math.max(pad,Math.min(r.top-20,vh-h-pad));}
      else top=Math.max(pad,Math.min(top,vh-h-pad));
    }
    popup.style.left=`${left}px`;popup.style.top=`${top}px`;
  }
  function show(target,lock=false,focus=false,idOverride){
    ensurePopup();clearTimeout(hideTimer);clearTimeout(hoverTimer);
    if(anchor)anchor.setAttribute('aria-expanded','false');
    anchor=target;origin=target;activeRoot=target.closest('.katex');pinned=lock;
    const context=activeRoot?.dataset.termContext||'general',id=idOverride||target.dataset.term,entry=describe(id,context);if(!entry)return;
    const previousFocus=popup.contains(document.activeElement)?document.activeElement.dataset?.termLink:null;
    popup.replaceChildren();popup.dataset.pinned=String(pinned);popup.dataset.currentTerm=id;popup.dataset.context=context;
    const top=make('div','math-term-top'),category=make('span','math-term-context',contexts[context]),closeButton=make('button','math-term-close','×');closeButton.type='button';closeButton.setAttribute('aria-label','Close symbol explanation');closeButton.addEventListener('click',()=>close(true));top.append(category,closeButton);popup.append(top);
    const heading=make('div','math-term-heading'),symbol=make('span','math-term-symbol'),title=make('h4',null,entry.title);title.id='math-term-title';
    math(symbol,idOverride?entry.tex:(target.dataset.termTex||entry.tex));heading.append(symbol,title);popup.append(heading,explanation(entry.description));
    if(pinned&&entry.related?.length){const label=make('div','math-term-section-label','RELATED SYMBOLS'),list=make('div','math-term-related');
      for(const rid of entry.related){const item=describe(rid,context),b=make('button','math-term-chip');b.type='button';b.dataset.termLink=rid;const glyph=make('span');math(glyph,item.tex);b.append(glyph,make('span',null,item.title));b.addEventListener('click',()=>show(target,true,true,rid));list.append(b);}popup.append(label,list);}
    const terms=activeRoot?[...activeRoot.querySelectorAll('[data-term]')].filter((e,i,all)=>all.findIndex(n=>n.dataset.term===e.dataset.term)===i):[];
    if(pinned&&terms.length>1){const row=make('div','math-term-equation-terms');row.setAttribute('role','group');row.setAttribute('aria-label','Symbols in this equation');
      for(const el of terms){const b=make('button','math-term-equation-chip');b.type='button';b.setAttribute('aria-label',describe(el.dataset.term,context).title);b.setAttribute('aria-pressed',String(el.dataset.term===id));math(b,el.dataset.termTex);b.addEventListener('click',()=>show(el,true,true));row.append(b);}popup.append(make('div','math-term-section-label','IN THIS EQUATION'),row);}
    const footer=make('div','math-term-footer'),hint=make('span',null,pinned?'Pinned · Esc to close':'Click a symbol to keep this open');
    const pin=make('button','math-term-pin',pinned?'Unpin':'Pin explanation');pin.type='button';pin.setAttribute('aria-pressed',String(pinned));pin.addEventListener('click',()=>{show(target,!pinned,true,idOverride);});footer.append(hint,pin);popup.append(footer);
    popup.hidden=false;target.setAttribute('aria-expanded','true');
    document.querySelectorAll('.math-term-active').forEach(e=>e.classList.remove('math-term-active'));
    activeRoot?.querySelectorAll(`[data-term="${id}"]`).forEach(e=>e.classList.add('math-term-active'));
    position();
    if(focus)(previousFocus?popup.querySelector(`[data-term-link="${previousFocus}"]`):null)?.focus({preventScroll:true});
    if(focus&&!popup.contains(document.activeElement))closeButton.focus({preventScroll:true});
  }
  function enhance(root){
    if(!root?.isConnected&&root!==document)return;
    if(anchor&&!anchor.isConnected)close();
    const equations=[...(root.matches?.('.katex')?[root]:[]),...root.querySelectorAll('.katex:not([data-terms-ready])')];
    for(const equation of equations){
      if(equation.dataset.termsReady||equation.closest('.math-term-popover'))continue;
      const tex=equation.querySelector('annotation[encoding="application/x-tex"]')?.textContent;if(!tex)continue;
      const context=contextFor(equation,tex),annotated=annotate(tex,context);
      const temp=make('span');
      try{katex.render(annotated,temp,{displayMode:!!equation.closest('.math-display,.katex-display'),throwOnError:true,strict:code=>code==='htmlExtension'?'ignore':'error',trust:c=>c.command==='\\htmlData',output:'html'});}catch(error){console.error('Symbol annotation failed',tex,error);continue;}
      equation.dataset.termsReady='true';equation.dataset.termContext=context;
      const visual=equation.querySelector('.katex-html'),next=temp.querySelector('.katex-html');
      const terms=[...next.querySelectorAll('[data-term]')];if(!terms.length)continue;
      // KaTeX merges adjacent italic glyphs and keeps only the final italic
      // correction. Semantic wrappers split that run; restore its spacing.
      const glyphRuns=layer=>{let offset=0;return [...layer.querySelectorAll('.mathnormal')].filter(e=>!e.children.length).map(e=>{const start=offset;offset+=e.textContent.length;return {e,start,end:offset};});};
      const originalRuns=glyphRuns(visual),newRuns=glyphRuns(next);
      if(originalRuns.map(r=>r.e.textContent).join('')===newRuns.map(r=>r.e.textContent).join('')){
        for(const run of originalRuns){const split=newRuns.filter(r=>r.start>=run.start&&r.end<=run.end);if(split.length>1&&split[0].start===run.start&&split.at(-1).end===run.end)split.forEach((r,i)=>r.e.style.marginRight=i===split.length-1?run.e.style.marginRight:'0em');}
      }
      visual.replaceWith(next);
      // MathML retains the complete original equation. The visual layer provides
      // a separately labelled group of keyboard-operable symbol buttons.
      next.removeAttribute('aria-hidden');next.setAttribute('role','group');next.setAttribute('aria-label','Explore equation symbols; use left and right arrows to move between terms');
      function hideDecoration(node){for(const child of node.children){if(child.matches('[data-term]'))continue;if(child.querySelector('[data-term]'))hideDecoration(child);else child.setAttribute('aria-hidden','true');}}hideDecoration(next);
      for(const [index,el] of terms.entries()){
        el.classList.add('math-term');el.tabIndex=index===0?0:-1;el.setAttribute('role','button');el.setAttribute('aria-haspopup','dialog');el.setAttribute('aria-expanded','false');el.setAttribute('aria-controls','math-term-popover');
        el.dataset.termTex=entries[el.dataset.term].tex;
        el.setAttribute('aria-label',describe(el.dataset.term,context).title+'; show explanation');
        el.addEventListener('pointerenter',e=>{if(e.pointerType==='touch'||pinned)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>show(el),100);});
        el.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);delayHide();});
        el.addEventListener('focus',()=>{if(!pinned&&!pointerActive)show(el);});
        el.addEventListener('blur',()=>delayHide());
        el.addEventListener('click',e=>{e.stopPropagation();show(el,true);});
        el.addEventListener('keydown',e=>{pointerActive=false;
          if(e.key==='Enter'||e.key===' '){e.preventDefault();show(el,true,true);}
          if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const at=terms.indexOf(el),j=e.key==='Home'?0:e.key==='End'?terms.length-1:(at+(e.key==='ArrowRight'?1:-1)+terms.length)%terms.length;terms.forEach((n,k)=>n.tabIndex=k===j?0:-1);if(pinned)close();terms[j].focus();}
        });
      }
      // Recover exact matched notation (e.g. Γ_noh versus Γ_i) in source order.
      const sources=[...annotated.matchAll(/\{\\htmlData\{term=([a-z0-9-]+),term-index=(\d+)\}\{/g)];
      sources.forEach((m,i)=>{let p=m.index+m[0].length,depth=1,end=p;for(;end<annotated.length;end++){if(annotated[end]==='{')depth++;if(annotated[end]==='}'&&--depth===0)break;}const el=terms.find(t=>t.dataset.termIndex===m[2]);if(el)el.dataset.termTex=annotated.slice(p,end);});
      const display=equation.closest('.math-display');
      if(display&&!display.previousElementSibling?.matches('.math-explore-bar')){
        display.id ||= `equation-${++sequence}`;
        const bar=make('div','math-explore-bar'),hint=make('span',null,'Hover a symbol · click to explore'),button=make('button','math-explore-button','Explore terms ↗');button.type='button';button.setAttribute('aria-controls',display.id);button.addEventListener('click',()=>{origin=button;show(terms[0],true,true);origin=button;});bar.append(hint,button);display.before(bar);
      }
    }
  }
  api.enhance=enhance;api.schedule=root=>queueMicrotask(()=>enhance(root));
  document.addEventListener('keydown',e=>{pointerActive=false;if(e.key==='Escape'&&popup&&!popup.hidden){e.preventDefault();close(true);}});
  document.addEventListener('pointerdown',e=>{pointerActive=true;if(popup&&!popup.hidden&&!popup.contains(e.target)&&!e.target.closest('.math-term,.math-explore-button'))close();});
  document.addEventListener('scroll',position,true);window.addEventListener('resize',position);
  document.addEventListener('DOMContentLoaded',()=>{ensurePopup();enhance(document);});
})();
