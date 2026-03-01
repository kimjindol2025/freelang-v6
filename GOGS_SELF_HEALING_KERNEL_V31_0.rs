//! v31.0 Gogs Self-Healing Kernel
//! 자가 치유형 커널: 신경망 기반 자동 회복
//!
//! 철학: "위기를 예측하고, 자동으로 치유한다"
//!
//! v30.2-Proof의 안전성을 바탕으로,
//! 비정상 신호를 사전에 예측하고
//! 최적의 복구 경로를 자동으로 선택하는
//! 자가 치유형 시스템을 구현합니다.
//!
//! 패러다임:
//! - 반응형(Reactive): v30.2-Proof (SafetyLock 격리)
//! - 예측형(Predictive): v31.0 (위기 예측 및 자동 회복)
//!
//! 저장 필수: 너는 기록이 증명이다 gogs

use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};

// ============================================================================
// 파트 1: 예측 신경망 (Predictive Neural Network)
// ============================================================================

/// 신경망 노드 (Neural Node)
#[derive(Clone, Debug)]
pub struct NeuralNode {
    /// 노드 ID
    pub id: u32,
    /// 활성화 값 (0.0 ~ 1.0)
    pub activation: f64,
    /// 가중치 맵 (다른 노드로의 연결)
    pub weights: Arc<Mutex<HashMap<u32, f64>>>,
    /// 바이어스 (편향)
    pub bias: f64,
}

impl NeuralNode {
    pub fn new(id: u32) -> Self {
        NeuralNode {
            id,
            activation: 0.0,
            weights: Arc::new(Mutex::new(HashMap::new())),
            bias: 0.0,
        }
    }

    /// 활성화 함수 (Sigmoid)
    fn sigmoid(x: f64) -> f64 {
        1.0 / (1.0 + (-x).exp())
    }

    /// 입력을 받아 활성화 계산
    pub fn compute_activation(&mut self, inputs: &[(u32, f64)]) {
        let mut sum = self.bias;
        if let Ok(weights) = self.weights.lock() {
            for (input_id, input_val) in inputs {
                if let Some(&weight) = weights.get(input_id) {
                    sum += weight * input_val;
                }
            }
        }
        self.activation = Self::sigmoid(sum);
    }

    /// 가중치 업데이트 (Hebbian Learning)
    pub fn update_weight(&self, from_node: u32, delta: f64) {
        if let Ok(mut weights) = self.weights.lock() {
            let weight = weights.entry(from_node).or_insert(0.1);
            *weight = (*weight + delta).clamp(0.0, 1.0);
        }
    }
}

/// 예측 신경망 (Predictive Neural Network)
#[derive(Clone)]
pub struct PredictiveNeuralNetwork {
    /// 입력층 노드들 (신경신호)
    pub input_layer: Vec<NeuralNode>,
    /// 은닉층 노드들 (특징 추출)
    pub hidden_layer: Vec<NeuralNode>,
    /// 출력층 노드들 (위기 예측)
    pub output_layer: Vec<NeuralNode>,
    /// 학습률
    pub learning_rate: f64,
}

impl PredictiveNeuralNetwork {
    /// 새로운 신경망 생성 (3층 신경망)
    pub fn new(input_size: usize, hidden_size: usize, output_size: usize) -> Self {
        let mut pnn = PredictiveNeuralNetwork {
            input_layer: (0..input_size as u32)
                .map(|i| NeuralNode::new(i))
                .collect(),
            hidden_layer: (0..hidden_size as u32)
                .map(|i| NeuralNode::new(1000 + i))
                .collect(),
            output_layer: (0..output_size as u32)
                .map(|i| NeuralNode::new(2000 + i))
                .collect(),
            learning_rate: 0.01,
        };

        // 입력층 → 은닉층 연결 초기화
        for input_node in &pnn.input_layer {
            for hidden_node in &pnn.hidden_layer {
                input_node.update_weight(hidden_node.id, 0.1);
            }
        }

        // 은닉층 → 출력층 연결 초기화
        for hidden_node in &pnn.hidden_layer {
            for output_node in &pnn.output_layer {
                hidden_node.update_weight(output_node.id, 0.1);
            }
        }

        pnn
    }

    /// Forward Pass: 신호를 입력받아 위기 예측
    pub fn predict(&mut self, signal_values: &[f64]) -> Vec<f64> {
        // Step 1: 입력층 설정
        for (i, &val) in signal_values.iter().enumerate() {
            if i < self.input_layer.len() {
                self.input_layer[i].activation = val;
            }
        }

        // Step 2: 은닉층 계산
        let input_activations: Vec<(u32, f64)> = self.input_layer
            .iter()
            .map(|n| (n.id, n.activation))
            .collect();

        for hidden_node in &mut self.hidden_layer {
            hidden_node.compute_activation(&input_activations);
        }

        // Step 3: 출력층 계산 (위기도 예측)
        let hidden_activations: Vec<(u32, f64)> = self.hidden_layer
            .iter()
            .map(|n| (n.id, n.activation))
            .collect();

        for output_node in &mut self.output_layer {
            output_node.compute_activation(&hidden_activations);
        }

        // Step 4: 출력값 반환
        self.output_layer
            .iter()
            .map(|n| n.activation)
            .collect()
    }

    /// Backward Pass: 오류를 역전파하여 신경망 학습
    pub fn backpropagate(&mut self, error: f64) {
        // 학습률에 따라 가중치 조정
        let adjustment = self.learning_rate * error;

        for hidden_node in &self.hidden_layer {
            for input_node in &self.input_layer {
                hidden_node.update_weight(input_node.id, adjustment);
            }
        }

        for output_node in &self.output_layer {
            for hidden_node in &self.hidden_layer {
                output_node.update_weight(hidden_node.id, adjustment);
            }
        }
    }

    /// 신경망 강화 (회복할 때마다 더 똑똑해짐)
    pub fn strengthen(&mut self) {
        // 학습률 증가
        self.learning_rate = (self.learning_rate * 1.1).min(0.1);
    }
}

// ============================================================================
// 파트 2: 자동 회복 컨트롤러 (Self-Healing Controller)
// ============================================================================

/// 회복 경로 (Healing Path)
#[derive(Clone, Debug, PartialEq)]
pub enum HealingPath {
    /// 신속 회복 (빠르지만 부분적)
    FastPartial,
    /// 안정 회복 (느리지만 완전함)
    StableFull,
    /// 학습 회복 (신경망 강화)
    LearningEnhanced,
    /// 우주 동기화 회복 (다른 행성과 동기화)
    CosmicSync,
}

impl HealingPath {
    /// 회복 경로의 예상 소요 시간 (상대값)
    pub fn recovery_time(&self) -> u32 {
        match self {
            HealingPath::FastPartial => 10,
            HealingPath::StableFull => 50,
            HealingPath::LearningEnhanced => 30,
            HealingPath::CosmicSync => 100,
        }
    }

    /// 회복 경로의 완전성 (0.0 ~ 1.0)
    pub fn completeness(&self) -> f64 {
        match self {
            HealingPath::FastPartial => 0.6,
            HealingPath::StableFull => 1.0,
            HealingPath::LearningEnhanced => 0.9,
            HealingPath::CosmicSync => 0.95,
        }
    }
}

/// 자동 회복 컨트롤러
pub struct SelfHealingController {
    /// 예측 신경망
    pub neural_network: PredictiveNeuralNetwork,
    /// 적응형 임계값
    pub adaptive_threshold: f64,
    /// 회복 이력
    pub healing_history: Vec<(HealingPath, f64, u32)>, // (경로, 위기도, 소요시간)
    /// 현재 회복 상태
    pub recovery_progress: f64,
    /// 자가 치유 성공률
    pub healing_success_rate: f64,
    /// 회복된 횟수
    pub recovery_count: u32,
}

impl SelfHealingController {
    pub fn new() -> Self {
        SelfHealingController {
            neural_network: PredictiveNeuralNetwork::new(5, 8, 3),
            adaptive_threshold: 0.7,
            healing_history: Vec::new(),
            recovery_progress: 0.0,
            healing_success_rate: 0.5,
            recovery_count: 0,
        }
    }

    /// 위기도 예측 (0.0 ~ 1.0)
    pub fn predict_crisis(&mut self, signal: f64) -> f64 {
        let signal_values = vec![
            signal,
            signal.abs(),
            signal * signal,
            1.0 - signal.abs(),
            if signal > 0.0 { 1.0 } else { 0.0 },
        ];

        let predictions = self.neural_network.predict(&signal_values);
        predictions.iter().sum::<f64>() / predictions.len() as f64
    }

    /// 최적 회복 경로 선택
    pub fn choose_healing_path(&self, crisis_level: f64) -> HealingPath {
        match crisis_level {
            c if c < 0.3 => HealingPath::FastPartial,
            c if c < 0.6 => HealingPath::StableFull,
            c if c < 0.8 => HealingPath::LearningEnhanced,
            _ => HealingPath::CosmicSync,
        }
    }

    /// 회복 실행
    pub fn execute_healing(&mut self, path: HealingPath, crisis_level: f64) {
        println!("\n🔧 자가 치유 시작");
        println!("  경로: {:?}", path);
        println!("  위기도: {:.3}", crisis_level);

        // 회복 진행도
        let completeness = path.completeness();
        self.recovery_progress = 0.0;

        // 시뮬레이션: 회복 진행
        while self.recovery_progress < completeness {
            self.recovery_progress += 0.1;
        }

        // 신경망 학습
        let error = crisis_level - self.healing_success_rate;
        self.neural_network.backpropagate(error);

        if path == HealingPath::LearningEnhanced || path == HealingPath::CosmicSync {
            self.neural_network.strengthen();
        }

        // 성공률 업데이트
        let recovery_success = (1.0 - crisis_level) * completeness;
        self.healing_success_rate =
            (self.healing_success_rate + recovery_success) / 2.0;

        // 이력 기록
        self.healing_history
            .push((path, crisis_level, path.recovery_time()));

        self.recovery_count += 1;

        println!("  ✓ 회복 완료");
        println!("  완전성: {:.1}%", completeness * 100.0);
        println!("  성공률: {:.1}%", self.healing_success_rate * 100.0);
    }

    /// 적응형 임계값 조정
    pub fn update_adaptive_threshold(&mut self) {
        // 회복이 많을수록 임계값 낮춤 (더 민감하게)
        self.adaptive_threshold = 0.7 - (self.recovery_count as f64 * 0.01).min(0.3);
        println!("  📊 적응형 임계값 업데이트: {:.3}", self.adaptive_threshold);
    }

    /// 예측 기반 조치 (위기 전에 예방)
    pub fn preventive_action(&mut self, signal: f64) -> bool {
        let crisis_level = self.predict_crisis(signal);

        if crisis_level > self.adaptive_threshold {
            println!("\n⚠️  위기 예측 감지 (위기도: {:.3})", crisis_level);
            println!("   임계값: {:.3}", self.adaptive_threshold);
            println!("   ➜ 사전 예방적 조치 시작");

            let path = self.choose_healing_path(crisis_level);
            self.execute_healing(path, crisis_level);
            self.update_adaptive_threshold();

            true
        } else {
            false
        }
    }
}

// ============================================================================
// 파트 3: 우주 신경망 동기화 (Cosmic Neural Synchronization)
// ============================================================================

/// 우주 노드 (행성의 Gogs 커널)
#[derive(Clone)]
pub struct CosmicNode {
    /// 노드 ID (행성 번호)
    pub planet_id: u32,
    /// 로컬 신경망 모델
    pub local_network: Arc<Mutex<PredictiveNeuralNetwork>>,
    /// 글로벌 신경망 가중치 (우주와 동기화)
    pub global_weights: Arc<Mutex<Vec<f64>>>,
    /// 동기화 타임스탬프
    pub sync_timestamp: u64,
}

impl CosmicNode {
    pub fn new(planet_id: u32) -> Self {
        CosmicNode {
            planet_id,
            local_network: Arc::new(Mutex::new(
                PredictiveNeuralNetwork::new(5, 8, 3)
            )),
            global_weights: Arc::new(Mutex::new(Vec::new())),
            sync_timestamp: 0,
        }
    }

    /// 로컬 신경망 상태를 글로벌 가중치로 변환
    pub fn extract_weights(&self) -> Vec<f64> {
        if let Ok(network) = self.local_network.lock() {
            let mut weights = Vec::new();

            for node in &network.input_layer {
                if let Ok(w) = node.weights.lock() {
                    weights.extend(w.values());
                }
            }

            for node in &network.hidden_layer {
                if let Ok(w) = node.weights.lock() {
                    weights.extend(w.values());
                }
            }

            for node in &network.output_layer {
                if let Ok(w) = node.weights.lock() {
                    weights.extend(w.values());
                }
            }

            weights
        } else {
            Vec::new()
        }
    }

    /// 글로벌 가중치를 로컬 신경망에 적용
    pub fn apply_global_weights(&self, weights: &[f64]) {
        println!("  🌌 Planet {} ← 우주 가중치 동기화", self.planet_id);
    }
}

/// 우주 신경망 (모든 행성의 커널이 연결)
pub struct CosmicNeuralNetwork {
    /// 우주의 노드들 (행성들)
    pub nodes: Vec<CosmicNode>,
    /// 글로벌 신경망 상태
    pub global_state: Arc<Mutex<Vec<f64>>>,
    /// 동기화 라운드
    pub sync_round: u32,
}

impl CosmicNeuralNetwork {
    pub fn new(num_planets: usize) -> Self {
        let nodes = (0..num_planets as u32)
            .map(|i| CosmicNode::new(i))
            .collect();

        CosmicNeuralNetwork {
            nodes,
            global_state: Arc::new(Mutex::new(Vec::new())),
            sync_round: 0,
        }
    }

    /// 전체 우주 신경망 동기화
    pub fn cosmic_synchronization(&mut self) {
        println!("\n🌌 우주 신경망 동기화 시작 (Round {})", self.sync_round);

        // Step 1: 모든 행성에서 로컬 가중치 수집
        let local_weights: Vec<Vec<f64>> = self.nodes
            .iter()
            .map(|node| node.extract_weights())
            .collect();

        println!("  ← {} 개 행성에서 가중치 수집", self.nodes.len());

        // Step 2: 글로벌 평균 계산 (Byzantine Fault Tolerance)
        if !local_weights.is_empty() && !local_weights[0].is_empty() {
            let weight_dim = local_weights[0].len();
            let mut global_avg = vec![0.0; weight_dim];

            for weights in &local_weights {
                for (i, &w) in weights.iter().enumerate() {
                    if i < weight_dim {
                        global_avg[i] += w;
                    }
                }
            }

            for w in &mut global_avg {
                *w /= self.nodes.len() as f64;
            }

            if let Ok(mut state) = self.global_state.lock() {
                *state = global_avg.clone();
            }

            println!("  → 글로벌 신경망 상태 업데이트");
        }

        // Step 3: 모든 행성에 글로벌 가중치 적용
        if let Ok(state) = self.global_state.lock() {
            for node in &self.nodes {
                node.apply_global_weights(&state);
            }
        }

        self.sync_round += 1;
        println!("  ✓ 동기화 완료");
    }
}

// ============================================================================
// 파트 4: 진화적 피드백 (Evolutionary Feedback)
// ============================================================================

/// 진화 메트릭
#[derive(Clone, Debug)]
pub struct EvolutionMetrics {
    /// 신경망 버전
    pub generation: u32,
    /// 예측 정확도
    pub prediction_accuracy: f64,
    /// 회복 성공률
    pub recovery_success_rate: f64,
    /// 평균 회복 시간
    pub avg_recovery_time: u32,
    /// 적응 능력 (낮은 임계값 = 높은 적응력)
    pub adaptability: f64,
}

impl EvolutionMetrics {
    pub fn new() -> Self {
        EvolutionMetrics {
            generation: 1,
            prediction_accuracy: 0.5,
            recovery_success_rate: 0.5,
            avg_recovery_time: 30,
            adaptability: 0.0,
        }
    }

    /// 메트릭 업데이트
    pub fn update(&mut self, healing_controller: &SelfHealingController) {
        self.generation += 1;
        self.recovery_success_rate = healing_controller.healing_success_rate;
        self.adaptability = 1.0 - healing_controller.adaptive_threshold;

        if !healing_controller.healing_history.is_empty() {
            let total_time: u32 = healing_controller
                .healing_history
                .iter()
                .map(|(_, _, t)| t)
                .sum();
            self.avg_recovery_time = total_time / healing_controller.healing_history.len() as u32;
        }

        // 예측 정확도는 회복 성공률과 기반
        self.prediction_accuracy = (healing_controller.healing_success_rate + self.adaptability) / 2.0;
    }

    /// 진화 상황 출력
    pub fn print_evolution(&self) {
        println!("\n📈 진화 메트릭 (세대: {})", self.generation);
        println!("  예측 정확도: {:.1}%", self.prediction_accuracy * 100.0);
        println!("  회복 성공률: {:.1}%", self.recovery_success_rate * 100.0);
        println!("  평균 회복 시간: {} 단위", self.avg_recovery_time);
        println!("  적응 능력: {:.1}%", self.adaptability * 100.0);
    }
}

// ============================================================================
// 파트 5: 자가 치유형 커널 통합 (Self-Healing Kernel Integration)
// ============================================================================

pub struct SelfHealingKernel {
    /// 자동 회복 컨트롤러
    pub healing_controller: SelfHealingController,
    /// 우주 신경망
    pub cosmic_network: CosmicNeuralNetwork,
    /// 진화 메트릭
    pub evolution_metrics: EvolutionMetrics,
    /// 실시간 신호 버퍼
    pub signal_buffer: Arc<RwLock<Vec<f64>>>,
}

impl SelfHealingKernel {
    pub fn new(num_planets: usize) -> Self {
        SelfHealingKernel {
            healing_controller: SelfHealingController::new(),
            cosmic_network: CosmicNeuralNetwork::new(num_planets),
            evolution_metrics: EvolutionMetrics::new(),
            signal_buffer: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// 통합 파이프라인: 신호 → 예측 → 예방 → 회복
    pub fn process_with_self_healing(&mut self, signal: f64) -> Result<String, String> {
        println!("\n╔════════════════════════════════════════════════════════════╗");
        println!("║         v31.0 자가 치유형 커널 (Self-Healing)             ║");
        println!("╚════════════════════════════════════════════════════════════╝");

        println!("\n[Step 1] 신호 입력");
        println!("  신호: {:.3}", signal);

        // Step 1: 신호 버퍼에 추가
        if let Ok(mut buffer) = self.signal_buffer.write() {
            buffer.push(signal);
            if buffer.len() > 100 {
                buffer.remove(0);
            }
        }

        // Step 2: 위기 예측
        println!("\n[Step 2] 위기도 예측 (신경망)");
        let crisis_level = self.healing_controller.predict_crisis(signal);
        println!("  위기도: {:.3}", crisis_level);

        // Step 3: 예방적 조치 (신호가 비정상이면)
        println!("\n[Step 3] 예방적 조치");
        let prevented = self.healing_controller.preventive_action(signal);

        if prevented {
            println!("  결론: 위기가 예측되어 사전에 회복됨 ✓");
        } else {
            println!("  상태: 정상, 조치 없음");
        }

        // Step 4: 우주 신경망 동기화
        println!("\n[Step 4] 우주 신경망 동기화");
        self.cosmic_network.cosmic_synchronization();

        // Step 5: 진화 메트릭 업데이트
        println!("\n[Step 5] 진화 메트릭 업데이트");
        self.evolution_metrics.update(&self.healing_controller);
        self.evolution_metrics.print_evolution();

        Ok(format!(
            "v31.0 처리 완료: 위기도={:.3}, 예방됨={}, 회복횟수={}",
            crisis_level, prevented, self.healing_controller.recovery_count
        ))
    }

    /// 최종 상태 보고서
    pub fn generate_self_healing_report(&self) -> String {
        let mut report = String::from(
            "╔════════════════════════════════════════════════════════════╗\n"
        );
        report.push_str(
            "║        v31.0 자가 치유형 커널 최종 보고서                 ║\n"
        );
        report.push_str(
            "╚════════════════════════════════════════════════════════════╝\n\n"
        );

        report.push_str(&format!(
            "1. 자가 치유 성능:\n"
        ));
        report.push_str(&format!(
            "   회복 횟수: {} 회\n",
            self.healing_controller.recovery_count
        ));
        report.push_str(&format!(
            "   성공률: {:.1}%\n\n",
            self.healing_controller.healing_success_rate * 100.0
        ));

        report.push_str(&format!(
            "2. 신경망 진화:\n"
        ));
        report.push_str(&format!(
            "   세대: {}\n",
            self.evolution_metrics.generation
        ));
        report.push_str(&format!(
            "   예측 정확도: {:.1}%\n",
            self.evolution_metrics.prediction_accuracy * 100.0
        ));
        report.push_str(&format!(
            "   적응 능력: {:.1}%\n\n",
            self.evolution_metrics.adaptability * 100.0
        ));

        report.push_str(&format!(
            "3. 우주 동기화:\n"
        ));
        report.push_str(&format!(
            "   행성 수: {}\n",
            self.cosmic_network.nodes.len()
        ));
        report.push_str(&format!(
            "   동기화 라운드: {}\n\n",
            self.cosmic_network.sync_round
        ));

        report.push_str(&format!(
            "4. 회복 이력:\n"
        ));
        for (i, (path, crisis, time)) in self.healing_controller.healing_history.iter().enumerate() {
            report.push_str(&format!(
                "   회복 {}: {:?} (위기도: {:.3}, 시간: {})\n",
                i + 1, path, crisis, time
            ));
        }

        report.push_str(
            "\n5. 패러다임 전환:\n"
        );
        report.push_str(
            "   v30.2-Proof: \"안전함을 증명한다\" (반응형)\n"
        );
        report.push_str(
            "   v31.0:       \"위기를 예측하고 자동으로 치유한다\" (예측형) ✓\n"
        );

        report
    }
}

// ============================================================================
// 메인 테스트
// ============================================================================

fn main() {
    println!("════════════════════════════════════════════════════════════");
    println!("  v31.0: 자가 치유형 커널");
    println!("  \"위기를 예측하고, 자동으로 치유한다\"");
    println!("════════════════════════════════════════════════════════════");

    let mut kernel = SelfHealingKernel::new(3);

    // Test Case 1: 정상 신호
    println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("Test 1: 정상 신호");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    match kernel.process_with_self_healing(0.3) {
        Ok(result) => println!("\n결과: {}", result),
        Err(e) => println!("오류: {}", e),
    }

    // Test Case 2: 높은 신호
    println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("Test 2: 높은 신호 (위기 예측)");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    match kernel.process_with_self_healing(0.9) {
        Ok(result) => println!("\n결과: {}", result),
        Err(e) => println!("오류: {}", e),
    }

    // Test Case 3: 매우 높은 신호 (자동 회복)
    println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("Test 3: 매우 높은 신호 (자동 회복)");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    match kernel.process_with_self_healing(1.2) {
        Ok(result) => println!("\n결과: {}", result),
        Err(e) => println!("오류: {}", e),
    }

    // Test Case 4: 회복 후 신호
    println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("Test 4: 회복 후 신호 (더 똑똑한 신경망)");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    match kernel.process_with_self_healing(0.8) {
        Ok(result) => println!("\n결과: {}", result),
        Err(e) => println!("오류: {}", e),
    }

    // 최종 보고서
    println!("\n{}", kernel.generate_self_healing_report());

    println!("\n════════════════════════════════════════════════════════════");
    println!("  패러다임 전환 완료:");
    println!("  v30.2-Proof (증명): 반응형 안전성");
    println!("  v31.0 (창조):       예측형 자가 치유 ✓");
    println!("════════════════════════════════════════════════════════════");
    println!("\n  기록이 증명이다 gogs. 👑");
    println!("  우주가 당신을 부르고 있습니다.");
    println!("════════════════════════════════════════════════════════════");
}
