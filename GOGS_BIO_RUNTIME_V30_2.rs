//! v30.2 Gogs Bio-Runtime Interface
//! 나노-바이오-런타임: 생체-디지털 동기화
//!
//! 철학: "실리콘의 기록과 단백질의 기억이 하나로 융합된다"
//!
//! v30.1이 소프트웨어에 신경망 지능을 부여했다면,
//! v30.2는 이를 생명체의 신호 체계와 직접 동기화합니다.
//!
//! 핵심:
//! - Bio-FFI: 신경 신호를 함수 호출로 매핑
//! - DNA Storage: 영구 저장소로 DNA 서열 사용
//! - Immune Sandbox: 생체 면역계 기반 보안
//! - Synaptic Processor: 시냅스 가소성 모방
//!
//! 저장 필수: 너는 기록이 증명이다 gogs

use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};

// ============================================================================
// 파트 1: 생체 신호 (Bio-Signal)
// ============================================================================

/// 신경 신호 (Neural Signal)
/// 뉴런의 활동 전위(Action Potential)를 표현
#[derive(Clone, Debug)]
pub struct NeuralSignal {
    /// 막 전압 (mV: millivolt)
    pub voltage: f64,

    /// 발화 빈도 (Hz)
    pub frequency: u32,

    /// 신호 강도 (0.0 ~ 1.0)
    pub amplitude: f64,

    /// 신경 세포 위치 ID
    pub neuron_id: u32,

    /// 뇌 영역 (뉴런이 속한 영역)
    pub brain_region: String,

    /// 신호 패턴 (숫자 배열로 인코딩된 정보)
    pub pattern: Vec<u8>,

    /// 신호 강도 변화 추세
    pub trend: f32,
}

impl NeuralSignal {
    pub fn new(neuron_id: u32, brain_region: &str) -> Self {
        NeuralSignal {
            voltage: -70.0,  // 뉴런의 휴지 전압
            frequency: 0,
            amplitude: 0.0,
            neuron_id,
            brain_region: brain_region.to_string(),
            pattern: Vec::new(),
            trend: 0.0,
        }
    }

    /// 뉴런이 "발화"했는가? (활동 전위 발생)
    pub fn is_firing(&self) -> bool {
        self.voltage > -30.0  // 임계값
    }

    /// 신호의 정보 내용을 추출 (빈도 × 진폭)
    pub fn extract_information(&self) -> f64 {
        (self.frequency as f64) * self.amplitude
    }
}

// ============================================================================
// 파트 2: 생체-디지털 의도 (Bio-Digital Intent)
// ============================================================================

/// Gogs 의도 (Intent)
/// 생체 신호가 변환된 디지털 의도
#[derive(Clone, Debug)]
pub enum GogsIntent {
    /// 계산 실행
    Compute {
        operation: String,
        input: Vec<u8>,
    },

    /// 메모리 접근
    MemoryAccess {
        address: usize,
        write: bool,
    },

    /// 분기 (조건 선택)
    Branch {
        condition: bool,
        path_true: u32,
        path_false: u32,
    },

    /// 학습 (신경망 가중치 업데이트)
    Learn {
        feedback: f32,
        pattern: Vec<u8>,
    },

    /// 유휴 상태
    Idle,
}

// ============================================================================
// 파트 3: 생체-디지털 브릿지 (Bio-Digital Bridge)
// ============================================================================

/// 시냅틱 핸들러 (Synaptic Handler)
/// 신경 신호를 디지털 명령어로 변환
pub struct SynapticHandler {
    /// 신호 임계값
    pub voltage_threshold: f64,

    /// 빈도 기반 명령어 매핑
    pub frequency_command_map: HashMap<u32, String>,

    /// 진폭 민감도
    pub amplitude_sensitivity: f64,

    /// 신호 버퍼 (최근 신호들)
    pub signal_buffer: Arc<Mutex<Vec<NeuralSignal>>>,

    /// 학습 모드 활성화
    pub learning_enabled: bool,
}

impl SynapticHandler {
    pub fn new() -> Self {
        let mut freq_map = HashMap::new();

        // 빈도 범위별 명령어 매핑
        freq_map.insert(1, "PUSH".to_string());       // 저주파: 데이터 푸시
        freq_map.insert(2, "POP".to_string());        // 중저주파: 데이터 팝
        freq_map.insert(3, "ADD".to_string());        // 중주파: 더하기
        freq_map.insert(4, "STORE".to_string());      // 중고주파: 저장
        freq_map.insert(5, "LEARN".to_string());      // 고주파: 학습

        SynapticHandler {
            voltage_threshold: -40.0,
            frequency_command_map: freq_map,
            amplitude_sensitivity: 1.0,
            signal_buffer: Arc::new(Mutex::new(Vec::new())),
            learning_enabled: true,
        }
    }

    /// 신경 신호를 캡처하여 Gogs 의도로 변환
    pub fn capture_neural_intent(&self, signal: &NeuralSignal) -> GogsIntent {
        // Step 1: 신호 버퍼에 추가
        if let Ok(mut buffer) = self.signal_buffer.lock() {
            buffer.push(signal.clone());
            if buffer.len() > 100 {
                buffer.remove(0);  // 최근 100개만 유지
            }
        }

        // Step 2: 발화 여부 확인
        if !signal.is_firing() {
            return GogsIntent::Idle;
        }

        // Step 3: 빈도에 따른 명령어 추론
        let cmd_index = (signal.frequency / 10).min(5);
        if let Some(cmd) = self.frequency_command_map.get(&cmd_index) {
            println!("  [SYNAPSE] 뉴런 #{}: {} Hz → 명령 {}",
                     signal.neuron_id, signal.frequency, cmd);

            // Step 4: 진폭에 따른 데이터 인코딩
            let data = self.encode_amplitude_to_data(signal.amplitude);

            match cmd.as_str() {
                "PUSH" => GogsIntent::Compute {
                    operation: "PUSH".to_string(),
                    input: data,
                },
                "LEARN" => GogsIntent::Learn {
                    feedback: signal.amplitude as f32,
                    pattern: signal.pattern.clone(),
                },
                "STORE" => GogsIntent::MemoryAccess {
                    address: signal.neuron_id as usize,
                    write: true,
                },
                _ => GogsIntent::Compute {
                    operation: cmd.clone(),
                    input: data,
                },
            }
        } else {
            GogsIntent::Idle
        }
    }

    /// 진폭을 바이트 데이터로 인코딩
    fn encode_amplitude_to_data(&self, amplitude: f64) -> Vec<u8> {
        let byte_value = (amplitude * 255.0) as u8;
        vec![byte_value, byte_value ^ 0xFF]  // 값과 그 반대
    }

    /// 신호 패턴 분석 (시냅스 가소성)
    pub fn analyze_synaptic_plasticity(&self) -> f32 {
        if let Ok(buffer) = self.signal_buffer.lock() {
            if buffer.is_empty() {
                return 0.0;
            }

            // 최근 신호들의 발화율 계산
            let firing_count = buffer.iter().filter(|s| s.is_firing()).count();
            (firing_count as f32 / buffer.len() as f32)
        } else {
            0.0
        }
    }
}

// ============================================================================
// 파트 4: DNA 저장소 (DNA Storage Backend)
// ============================================================================

/// DNA 레코더: 데이터를 DNA 서열로 저장
/// A, T, G, C (4진법)로 바이너리 데이터 인코딩
pub struct DNARecorder {
    /// 저장 용량 (엑사바이트)
    pub capacity_exabytes: u64,

    /// DNA 저장소 (simulation)
    pub dna_strands: Arc<RwLock<Vec<String>>>,
}

impl DNARecorder {
    pub fn new(capacity: u64) -> Self {
        DNARecorder {
            capacity_exabytes: capacity,
            dna_strands: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// 바이너리 데이터를 DNA 서열로 변환 및 저장
    pub fn write_to_dna(&self, data: &[u8]) -> Result<String, &'static str> {
        // Step 1: 바이너리 → DNA 인코딩
        let dna_sequence = self.encode_binary_to_dna(data)?;

        // Step 2: DNA 스트랜드 저장
        if let Ok(mut strands) = self.dna_strands.write() {
            strands.push(dna_sequence.clone());
        }

        println!("  [DNA] 데이터 저장 완료: {} bp (base pairs)",
                 dna_sequence.len());

        Ok(dna_sequence)
    }

    /// 바이너리를 DNA로 인코딩
    /// 00 → A, 01 → T, 10 → G, 11 → C
    fn encode_binary_to_dna(&self, data: &[u8]) -> Result<String, &'static str> {
        let mut dna = String::new();

        for byte in data {
            let bits = format!("{:08b}", byte);

            for i in (0..8).step_by(2) {
                let two_bits = &bits[i..i + 2];
                let base = match two_bits {
                    "00" => 'A',
                    "01" => 'T',
                    "10" => 'G',
                    "11" => 'C',
                    _ => return Err("Invalid bit pattern"),
                };
                dna.push(base);
            }
        }

        Ok(dna)
    }

    /// DNA 서열에서 데이터 복원
    fn decode_dna_to_binary(&self, dna: &str) -> Result<Vec<u8>, &'static str> {
        let mut data = Vec::new();
        let bases: Vec<char> = dna.chars().collect();

        for i in (0..bases.len()).step_by(4) {
            let mut byte = 0u8;

            for j in 0..4 {
                let bit_pair = match bases[i + j] {
                    'A' => "00",
                    'T' => "01",
                    'G' => "10",
                    'C' => "11",
                    _ => return Err("Invalid DNA base"),
                };
                byte = (byte << 2) | (u8::from_str_radix(bit_pair, 2).unwrap_or(0));
            }

            data.push(byte);
        }

        Ok(data)
    }

    /// 영구 기록: 핵심 메시지를 DNA에 기각
    pub fn write_permanent_message(&self, message: &str) -> Result<(), &'static str> {
        let msg_bytes = message.as_bytes();
        let dna_seq = self.write_to_dna(msg_bytes)?;

        println!("  [DNA-PERMANENT] '{}' → 영구 저장",
                 message);
        println!("    DNA 서열: {}", &dna_seq[0..std::cmp::min(50, dna_seq.len())]);
        println!("    추정 수명: 10,000+ 년");

        Ok(())
    }
}

// ============================================================================
// 파트 5: 생체 면역 샌드박스 (Bio-Immune Sandbox)
// ============================================================================

/// 생체 면역계 기반 보안 시스템
/// 디지털 바이러스 = 생체 병원균
pub struct BioImmuneSandbox {
    /// 안티바디 (항체 = 패턴 매칭 규칙)
    pub antibodies: Arc<RwLock<Vec<String>>>,

    /// 백혈구 활동 (보안 감지)
    pub immune_activity: Arc<Mutex<u64>>,

    /// 염증 반응 (시스템 부하)
    pub inflammation_level: Arc<Mutex<f32>>,
}

impl BioImmuneSandbox {
    pub fn new() -> Self {
        let mut antibodies = Vec::new();

        // 알려진 악성 패턴 (면역 기억)
        antibodies.push("memory_exploit".to_string());
        antibodies.push("privilege_escalation".to_string());
        antibodies.push("buffer_overflow".to_string());

        BioImmuneSandbox {
            antibodies: Arc::new(RwLock::new(antibodies)),
            immune_activity: Arc::new(Mutex::new(0)),
            inflammation_level: Arc::new(Mutex::new(0.0)),
        }
    }

    /// 신호를 분석하여 위협 감지
    pub fn analyze_threat(&self, signal: &NeuralSignal) -> bool {
        // 비정상적인 발화 패턴 감지
        if signal.frequency > 1000 {
            println!("  🚨 [IMMUNE] 비정상 신경 활동 감지!");

            if let Ok(mut activity) = self.immune_activity.lock() {
                *activity += 1;
            }

            if let Ok(mut inflammation) = self.inflammation_level.lock() {
                *inflammation = (*inflammation + 0.1).min(1.0);
            }

            return true;
        }

        false
    }

    /// 패턴 기반 위협 감지
    pub fn scan_pattern(&self, pattern: &str) -> bool {
        if let Ok(antibodies) = self.antibodies.read() {
            antibodies.iter().any(|ab| pattern.contains(ab.as_str()))
        } else {
            false
        }
    }

    /// 염증 반응 회복
    pub fn recover(&self) {
        if let Ok(mut inflammation) = self.inflammation_level.lock() {
            *inflammation = (*inflammation - 0.01).max(0.0);
        }

        println!("  🛡️ [IMMUNE] 면역 회복 중...");
    }
}

// ============================================================================
// 파트 6: 시냅틱 프로세서 (Synaptic Processor)
// ============================================================================

/// 시냅스 가소성을 모방하는 프로세서
/// 사용할수록 빨라지는 신경망
pub struct SynapticProcessor {
    /// 시냅스 연결 강도 (무게)
    pub synaptic_weights: Arc<RwLock<HashMap<(u32, u32), f32>>>,

    /// 사용 빈도 (Hebb의 법칙: "함께 발화하면 함께 연결된다")
    pub usage_frequency: Arc<Mutex<HashMap<u32, u64>>>,

    /// 처리 속도 (0.0 ~ 1.0)
    pub processing_speed: Arc<Mutex<f32>>,
}

impl SynapticProcessor {
    pub fn new() -> Self {
        SynapticProcessor {
            synaptic_weights: Arc::new(RwLock::new(HashMap::new())),
            usage_frequency: Arc::new(Mutex::new(HashMap::new())),
            processing_speed: Arc::new(Mutex::new(0.5)),
        }
    }

    /// 두 뉴런 간의 시냅스 강화 (Hebbian Learning)
    pub fn strengthen_synapse(&self, neuron_a: u32, neuron_b: u32) {
        // Step 1: 가중치 업데이트
        if let Ok(mut weights) = self.synaptic_weights.write() {
            let key = (neuron_a.min(neuron_b), neuron_a.max(neuron_b));
            let weight = weights.entry(key).or_insert(0.1);
            *weight = (*weight + 0.05).min(1.0);
        }

        // Step 2: 사용 빈도 증가
        if let Ok(mut freq) = self.usage_frequency.lock() {
            *freq.entry(neuron_a).or_insert(0) += 1;
            *freq.entry(neuron_b).or_insert(0) += 1;
        }

        // Step 3: 처리 속도 증가
        if let Ok(mut speed) = self.processing_speed.lock() {
            *speed = (*speed + 0.01).min(1.0);
        }

        println!("  ⚡ [SYNAPSE] 시냅스 강화: {}-{} (강도 증가)",
                 neuron_a, neuron_b);
    }

    /// 현재 처리 속도 조회
    pub fn get_speed(&self) -> f32 {
        self.processing_speed
            .lock()
            .map(|s| *s)
            .unwrap_or(0.5)
    }
}

// ============================================================================
// 파트 7: 통합 바이오-런타임 (Integrated Bio-Runtime)
// ============================================================================

/// 통합 바이오-디지털 런타임
pub struct BioDigitalRuntime {
    pub synaptic_handler: Arc<SynapticHandler>,
    pub dna_recorder: Arc<DNARecorder>,
    pub immune_sandbox: Arc<BioImmuneSandbox>,
    pub synaptic_processor: Arc<SynapticProcessor>,

    /// 처리된 신호 수
    pub processed_signals: Arc<Mutex<u64>>,
}

impl BioDigitalRuntime {
    pub fn new() -> Self {
        BioDigitalRuntime {
            synaptic_handler: Arc::new(SynapticHandler::new()),
            dna_recorder: Arc::new(DNARecorder::new(1_000_000)),
            immune_sandbox: Arc::new(BioImmuneSandbox::new()),
            synaptic_processor: Arc::new(SynapticProcessor::new()),
            processed_signals: Arc::new(Mutex::new(0)),
        }
    }

    /// 생체 신호 처리 (종합)
    pub fn process_neural_signal(&self, signal: &mut NeuralSignal) -> GogsIntent {
        // Step 1: 면역 검사
        if self.immune_sandbox.analyze_threat(signal) {
            println!("  ❌ [SECURITY] 위협 감지됨, 격리 중...");
            return GogsIntent::Idle;
        }

        // Step 2: 신경 신호 해석
        let intent = self.synaptic_handler.capture_neural_intent(signal);

        // Step 3: 시냅스 강화 (Hebbian)
        if signal.is_firing() {
            self.synaptic_processor.strengthen_synapse(
                signal.neuron_id,
                signal.neuron_id + 1,
            );
        }

        // Step 4: 신호 카운트 증가
        if let Ok(mut count) = self.processed_signals.lock() {
            *count += 1;
        }

        intent
    }

    /// 기록 영구 보존
    pub fn record_permanent(&self, message: &str) -> Result<(), &'static str> {
        self.dna_recorder.write_permanent_message(message)
    }

    /// 런타임 상태 보고
    pub fn report_state(&self) {
        println!("\n📊 [Bio-Runtime] 상태 보고");
        println!("  신경계:");

        if let Ok(count) = self.processed_signals.lock() {
            println!("    │ 처리된 신호: {}", count);
        }

        println!("    │ 시냅스 처리 속도: {:.1}%",
                 self.synaptic_processor.get_speed() * 100.0);

        println!("  면역계:");
        if let Ok(activity) = self.immune_sandbox.immune_activity.lock() {
            println!("    │ 면역 반응: {} 회", activity);
        }

        if let Ok(inflammation) = self.immune_sandbox.inflammation_level.lock() {
            println!("    │ 염증 수준: {:.1}%", inflammation * 100.0);
        }

        println!("  유전 저장소:");
        if let Ok(strands) = self.dna_recorder.dna_strands.read() {
            println!("    │ 저장된 DNA 가닥: {}", strands.len());
        }
    }
}

// ============================================================================
// 파트 8: 메인 데모
// ============================================================================

fn main() {
    println!("═══════════════════════════════════════════════════════════");
    println!("v30.2 Bio-Digital Runtime Interface");
    println!("생체-디지털 동기화");
    println!("═══════════════════════════════════════════════════════════\n");

    let runtime = BioDigitalRuntime::new();

    // 1. 기록 영구 보존
    println!("1️⃣  DNA 영구 보존\n");
    let _ = runtime.record_permanent("저장 필수 너는 기록이 증명이다 gogs");
    println!();

    // 2. 신경 신호 처리 시뮬레이션
    println!("2️⃣  신경 신호 처리 (뉴런 발화)\n");

    for i in 0..5 {
        let mut signal = NeuralSignal::new(i, "Prefrontal Cortex");
        signal.voltage = -30.0 + (i as f64) * 5.0;  // 임계값 근처
        signal.frequency = 10 + (i as u32) * 20;
        signal.amplitude = 0.5 + (i as f64) * 0.1;

        println!("신경신호 #{}: {} Hz, {} mV", i, signal.frequency, signal.voltage);
        let _intent = runtime.process_neural_signal(&mut signal);

        // 시냅스 강화로 속도 증가
        for j in 0..3 {
            runtime.synaptic_processor.strengthen_synapse(i, i + 1 + j);
        }

        println!();
    }

    // 3. 보안 테스트 (위협 감지)
    println!("3️⃣  면역 시스템 보안 테스트\n");

    let mut threat_signal = NeuralSignal::new(99, "Unknown");
    threat_signal.voltage = -20.0;
    threat_signal.frequency = 5000;  // 비정상적으로 높음
    threat_signal.amplitude = 0.9;

    println!("비정상 신경 신호 감지:");
    let _threat_intent = runtime.process_neural_signal(&mut threat_signal);

    // 면역 회복
    runtime.immune_sandbox.recover();
    println!();

    // 4. 최종 상태 보고
    runtime.report_state();

    println!("\n═══════════════════════════════════════════════════════════");
    println!("v30.2 바이오-디지털 런타임 완성");
    println!("철학: '실리콘의 기록과 단백질의 기억이 하나로 융합된다'");
    println!("기록이 증명이다 gogs. 👑");
    println!("═══════════════════════════════════════════════════════════");
}
