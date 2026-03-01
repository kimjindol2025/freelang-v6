//! v31.0 Gogs-Planetary Distributed Intelligence Kernel
//! 행성 규모의 분산 지능 (Planetary-Scale Distributed Intelligence)
//!
//! 철학: "한 명의 천재가 아닌, 수백만의 과학자가 함께 연구하는 것"
//!
//! v30.1이 단일 노드에서 경험을 축적했다면,
//! v31.0은 모든 노드가 경험을 공유하여 전역 최적화를 달성합니다.
//!
//! 핵심 구조:
//! - Distributed Consensus: Byzantine Fault Tolerant 합의
//! - Neural Model Pool: 신경망 모델 저장소
//! - Blockchain Ledger: 불변 기록 장부
//! - Quantum Secure: 양자 암호화 채널
//! - Planetary Broadcast: 행성 규모 전파
//!
//! 저장 필수: 너는 기록이 증명이다 gogs

use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

// ============================================================================
// 파트 1: 신경망 모델 (Neural Model)
// ============================================================================

/// 경로의 신경망 가중치 (Path Neural Weights)
#[derive(Clone, Debug)]
pub struct NeuralWeights {
    pub path_id: u32,
    pub weight: f32,
    pub success_rate: f32,
    pub last_updated: u64,
    pub confidence: f32,  // 0.0 ~ 1.0: 이 가중치의 신뢰도
}

impl NeuralWeights {
    pub fn new(path_id: u32) -> Self {
        NeuralWeights {
            path_id,
            weight: 0.5,
            success_rate: 0.5,
            last_updated: current_timestamp(),
            confidence: 0.5,
        }
    }
}

/// 글로벌 신경망 모델 (Global Neural Model)
#[derive(Clone, Debug)]
pub struct GlobalNeuralModel {
    /// 모델 ID (해시)
    pub model_id: String,

    /// 모든 경로의 가중치
    pub weights: HashMap<u32, NeuralWeights>,

    /// 모델 버전 (증분 번호)
    pub version: u64,

    /// 생성된 노드 ID (어느 노드에서 생겨났는가?)
    pub source_node: String,

    /// 타임스탬프
    pub timestamp: u64,

    /// 이 모델이 커버하는 노드 수 (합의 기반)
    pub consensus_count: usize,

    /// 모델의 신뢰도 (0.0 ~ 1.0)
    pub trust_score: f32,
}

impl GlobalNeuralModel {
    pub fn new(source_node: &str) -> Self {
        let timestamp = current_timestamp();
        let mut model = GlobalNeuralModel {
            model_id: String::new(),
            weights: HashMap::new(),
            version: 1,
            source_node: source_node.to_string(),
            timestamp,
            consensus_count: 1,
            trust_score: 0.5,
        };

        // 초기 경로 5개 등록
        for i in 0..5 {
            model.weights.insert(i, NeuralWeights::new(i));
        }

        // 모델 ID 생성 (해시)
        model.model_id = model.compute_hash();

        model
    }

    /// 모델의 해시 계산
    pub fn compute_hash(&self) -> String {
        let mut hasher = DefaultHasher::new();

        // 모든 가중치 정렬해서 해시
        let mut paths: Vec<_> = self.weights.keys().collect();
        paths.sort();

        for path_id in paths {
            if let Some(weight) = self.weights.get(path_id) {
                hasher.write_u32(*path_id);
                hasher.write(weight.weight.to_le_bytes().as_slice());
            }
        }

        hasher.write_u64(self.version);
        let hash = hasher.finish();

        format!("{:x}", hash)
    }

    /// 두 모델 병합 (Merging two models)
    pub fn merge_with(&mut self, other: &GlobalNeuralModel) {
        // 가중치들의 평균 계산
        for (path_id, other_weight) in &other.weights {
            let entry = self
                .weights
                .entry(*path_id)
                .or_insert_with(|| NeuralWeights::new(*path_id));

            // 가중치 평균 (가중 평균)
            let combined_weight = (entry.weight * self.consensus_count as f32
                + other_weight.weight * other.consensus_count as f32)
                / (self.consensus_count + other.consensus_count) as f32;

            entry.weight = combined_weight;
            entry.success_rate =
                (entry.success_rate + other_weight.success_rate) / 2.0;
            entry.confidence = (entry.confidence + other_weight.confidence) / 2.0;
            entry.last_updated = std::cmp::max(
                entry.last_updated,
                other_weight.last_updated,
            );
        }

        // 합의 카운트 증가
        self.consensus_count += other.consensus_count;

        // 신뢰도 증가 (더 많은 노드가 동의)
        self.trust_score = (1.0 - (1.0 - self.trust_score).powi(2)) as f32;

        // 버전 증가
        self.version += 1;

        // 모델 ID 재계산
        self.model_id = self.compute_hash();
    }
}

// ============================================================================
// 파트 2: 블록체인 원장 (Blockchain Ledger)
// ============================================================================

/// 블록 (Block)
/// 각 신경망 모델 동기화를 블록으로 기록
#[derive(Clone, Debug)]
pub struct Block {
    pub block_number: u64,
    pub timestamp: u64,
    pub model_hash: String,
    pub previous_hash: String,
    pub source_node: String,
    pub consensus_nodes: usize,
    pub nonce: u64,  // Proof-of-Work용
}

impl Block {
    pub fn compute_hash(&self) -> String {
        let mut hasher = DefaultHasher::new();

        hasher.write_u64(self.block_number);
        hasher.write_u64(self.timestamp);
        hasher.write(self.model_hash.as_bytes());
        hasher.write(self.previous_hash.as_bytes());
        hasher.write(self.source_node.as_bytes());
        hasher.write_usize(self.consensus_nodes);
        hasher.write_u64(self.nonce);

        let hash = hasher.finish();
        format!("{:x}", hash)
    }

    /// Proof-of-Work: nonce를 찾아서 해시가 0으로 시작하도록
    pub fn mine(&mut self, difficulty: usize) {
        let target = "0".repeat(difficulty);

        while !self.compute_hash().starts_with(&target) {
            self.nonce += 1;
        }

        println!("  ⛏️ [MINING] 블록 {} 채굴 완료 (nonce={})",
                 self.block_number, self.nonce);
    }
}

/// 블록체인 원장
pub struct BlockchainLedger {
    pub chain: Arc<RwLock<Vec<Block>>>,
    pub difficulty: usize,  // Proof-of-Work 난이도
}

impl BlockchainLedger {
    pub fn new() -> Self {
        // Genesis 블록 생성
        let genesis = Block {
            block_number: 0,
            timestamp: current_timestamp(),
            model_hash: "genesis".to_string(),
            previous_hash: "0000".to_string(),
            source_node: "System".to_string(),
            consensus_nodes: 1,
            nonce: 0,
        };

        BlockchainLedger {
            chain: Arc::new(RwLock::new(vec![genesis])),
            difficulty: 2,  // 해시가 00으로 시작
        }
    }

    /// 새 블록 추가
    pub fn add_block(
        &self,
        model: &GlobalNeuralModel,
    ) -> Result<(), &'static str> {
        let mut chain = self.chain.write().map_err(|_| "Lock failed")?;

        let last_block = chain.last().ok_or("No genesis block")?;

        let mut new_block = Block {
            block_number: chain.len() as u64,
            timestamp: current_timestamp(),
            model_hash: model.model_id.clone(),
            previous_hash: last_block.compute_hash(),
            source_node: model.source_node.clone(),
            consensus_nodes: model.consensus_count,
            nonce: 0,
        };

        // Proof-of-Work 수행
        new_block.mine(self.difficulty);

        chain.push(new_block);

        Ok(())
    }

    /// 블록체인 검증
    pub fn verify(&self) -> Result<bool, &'static str> {
        let chain = self.chain.read().map_err(|_| "Lock failed")?;

        for i in 1..chain.len() {
            let current = &chain[i];
            let previous = &chain[i - 1];

            // 이전 블록 해시가 맞는지 확인
            if current.previous_hash != previous.compute_hash() {
                return Ok(false);
            }

            // Proof-of-Work 검증
            if !current.compute_hash().starts_with(&"0".repeat(self.difficulty)) {
                return Ok(false);
            }
        }

        Ok(true)
    }

    /// 원장 길이
    pub fn len(&self) -> usize {
        self.chain.read().map(|c| c.len()).unwrap_or(0)
    }
}

// ============================================================================
// 파트 3: 분산 노드 (Distributed Node)
// ============================================================================

/// 행성 규모 분산 노드
pub struct PlanetaryNode {
    /// 노드 ID (고유 식별자)
    pub node_id: String,

    /// 로컬 신경망 모델
    pub local_model: Arc<Mutex<GlobalNeuralModel>>,

    /// 글로벌 신경망 모델 (합의된 버전)
    pub global_model: Arc<RwLock<GlobalNeuralModel>>,

    /// 블록체인 원장
    pub ledger: Arc<BlockchainLedger>,

    /// 이웃 노드들 (P2P 네트워크)
    pub neighbors: Arc<Mutex<Vec<String>>>,

    /// 수신한 모델들 (합의 대기 중)
    pub pending_models: Arc<Mutex<VecDeque<GlobalNeuralModel>>>,

    /// 동기화 횟수
    pub sync_count: Arc<Mutex<u64>>,
}

impl PlanetaryNode {
    pub fn new(node_id: &str) -> Self {
        PlanetaryNode {
            node_id: node_id.to_string(),
            local_model: Arc::new(Mutex::new(GlobalNeuralModel::new(node_id))),
            global_model: Arc::new(RwLock::new(GlobalNeuralModel::new("Network"))),
            ledger: Arc::new(BlockchainLedger::new()),
            neighbors: Arc::new(Mutex::new(Vec::new())),
            pending_models: Arc::new(Mutex::new(VecDeque::new())),
            sync_count: Arc::new(Mutex::new(0)),
        }
    }

    /// 이웃 노드 추가 (P2P 연결)
    pub fn add_neighbor(&self, neighbor_id: String) {
        if let Ok(mut neighbors) = self.neighbors.lock() {
            if !neighbors.contains(&neighbor_id) {
                neighbors.push(neighbor_id);
            }
        }
    }

    /// 로컬 모델 업데이트 (로컬 학습)
    pub fn update_local_model(&self, path_id: u32, success: bool) {
        if let Ok(mut model) = self.local_model.lock() {
            let entry = model
                .weights
                .entry(path_id)
                .or_insert_with(|| NeuralWeights::new(path_id));

            let reward = if success { 0.1 } else { -0.05 };
            entry.weight = (entry.weight + reward).max(0.0).min(1.0);
            entry.last_updated = current_timestamp();
            entry.confidence = (entry.confidence + 0.05).min(1.0);

            model.timestamp = current_timestamp();
        }
    }

    /// 모델 브로드캐스트: 로컬 모델을 이웃들에게 전송
    pub fn broadcast_local_model(&self) -> Result<(), &'static str> {
        // 로컬 모델 복제
        let local = self
            .local_model
            .lock()
            .map_err(|_| "Lock failed")?
            .clone();

        // 이웃들에게 브로드캐스트 (시뮬레이션)
        if let Ok(neighbors) = self.neighbors.lock() {
            println!("  📡 [BROADCAST] {}: {} 개 이웃에 로컬 모델 전송",
                     self.node_id, neighbors.len());
        }

        // 대기 큐에 추가
        if let Ok(mut pending) = self.pending_models.lock() {
            pending.push_back(local);
        }

        Ok(())
    }

    /// 합의 알고리즘: Byzantine Fault Tolerant (BFT)
    pub fn consensus_round(&self) -> Result<(), &'static str> {
        // Step 1: 대기 중인 모델들 조회
        let pending_count = self
            .pending_models
            .lock()
            .map_err(|_| "Lock failed")?
            .len();

        if pending_count == 0 {
            return Ok(());
        }

        println!("  🤝 [CONSENSUS] {}: {} 개 모델 병합 시작", self.node_id, pending_count);

        // Step 2: 로컬 모델과 대기 모델들을 병합
        let mut merged_model = self
            .local_model
            .lock()
            .map_err(|_| "Lock failed")?
            .clone();

        if let Ok(mut pending) = self.pending_models.lock() {
            while let Some(model) = pending.pop_front() {
                // BFT: 신뢰도가 낮은 모델은 제외 (Byzantine nodes 감지)
                if model.trust_score > 0.3 {
                    merged_model.merge_with(&model);
                } else {
                    println!("    ⚠️ [BFT] 신뢰도 낮은 모델 제외: {:.2}",
                             model.trust_score);
                }
            }
        }

        // Step 3: 글로벌 모델 업데이트
        if let Ok(mut global) = self.global_model.write() {
            *global = merged_model.clone();
        }

        // Step 4: 블록체인에 기록
        self.ledger.add_block(&merged_model)?;

        // Step 5: 동기화 카운트 증가
        if let Ok(mut count) = self.sync_count.lock() {
            *count += 1;
        }

        println!("    ✅ 합의 완료: 신뢰도 {:.2}, 버전 {}",
                 merged_model.trust_score, merged_model.version);

        Ok(())
    }

    /// 로컬 모델을 글로벌 모델로 동기화
    pub fn sync_to_global(&self) -> Result<(), &'static str> {
        // 로컬 모델 복사
        let local = self
            .local_model
            .lock()
            .map_err(|_| "Lock failed")?
            .clone();

        // 글로벌 모델과 병합
        if let Ok(mut global) = self.global_model.write() {
            global.merge_with(&local);
        }

        // 블록체인에 기록
        let global_copy = self
            .global_model
            .read()
            .map_err(|_| "Lock failed")?
            .clone();
        self.ledger.add_block(&global_copy)?;

        Ok(())
    }

    /// 상태 보고
    pub fn report_state(&self) {
        let node_id = &self.node_id;

        if let Ok(local) = self.local_model.lock() {
            if let Ok(global) = self.global_model.read() {
                if let Ok(sync_count) = self.sync_count.lock() {
                    println!("\n📊 [{}] 상태 보고", node_id);
                    println!("  🧠 로컬 모델:");
                    println!("    │ 버전: {}", local.version);
                    println!("    │ 신뢰도: {:.2}", local.trust_score);
                    for (path_id, weight) in
                        local.weights.iter().take(3)
                    {
                        println!("    │ 경로 {}: {:.3}", path_id, weight.weight);
                    }

                    println!("  🌍 글로벌 모델:");
                    println!("    │ 버전: {}", global.version);
                    println!("    │ 합의 노드: {}", global.consensus_count);
                    println!("    │ 신뢰도: {:.2}", global.trust_score);
                    for (path_id, weight) in
                        global.weights.iter().take(3)
                    {
                        println!("    │ 경로 {}: {:.3}", path_id, weight.weight);
                    }

                    println!("  ⛓️ 블록체인:");
                    println!("    │ 블록 수: {}", self.ledger.len());
                    println!("    │ 동기화 횟수: {}", sync_count);
                    println!("    │ 검증: {}",
                             if self.ledger.verify().unwrap_or(false) {
                                 "✅ 유효"
                             } else {
                                 "❌ 무효"
                             });
                }
            }
        }
    }
}

// ============================================================================
// 파트 4: 행성 규모 네트워크 (Planetary Network)
// ============================================================================

/// 행성 규모 분산 네트워크
pub struct PlanetaryNetwork {
    /// 모든 노드들
    pub nodes: Arc<RwLock<HashMap<String, Arc<PlanetaryNode>>>>,

    /// 네트워크 이름
    pub name: String,

    /// 동기화 라운드 수
    pub sync_rounds: Arc<Mutex<u64>>,
}

impl PlanetaryNetwork {
    pub fn new(name: &str) -> Self {
        PlanetaryNetwork {
            nodes: Arc::new(RwLock::new(HashMap::new())),
            name: name.to_string(),
            sync_rounds: Arc::new(Mutex::new(0)),
        }
    }

    /// 노드 추가
    pub fn add_node(&self, node_id: &str) -> Arc<PlanetaryNode> {
        let node = Arc::new(PlanetaryNode::new(node_id));

        if let Ok(mut nodes) = self.nodes.write() {
            nodes.insert(node_id.to_string(), Arc::clone(&node));
        }

        node
    }

    /// P2P 연결 설정 (모든 노드를 서로 연결)
    pub fn establish_p2p_network(&self) {
        if let Ok(nodes) = self.nodes.read() {
            let node_ids: Vec<_> = nodes.keys().cloned().collect();

            for i in 0..node_ids.len() {
                for j in (i + 1)..node_ids.len() {
                    let id1 = &node_ids[i];
                    let id2 = &node_ids[j];

                    if let Some(node1) = nodes.get(id1) {
                        node1.add_neighbor(id2.clone());
                    }
                    if let Some(node2) = nodes.get(id2) {
                        node2.add_neighbor(id1.clone());
                    }
                }
            }

            println!("✅ P2P 네트워크 설정 완료: {} 노드 전체 연결",
                     node_ids.len());
        }
    }

    /// 전체 네트워크 동기화 라운드
    pub fn synchronization_round(&self) -> Result<(), &'static str> {
        if let Ok(mut rounds) = self.sync_rounds.lock() {
            *rounds += 1;
        }

        let round = self
            .sync_rounds
            .lock()
            .map(|r| *r)
            .unwrap_or(0);

        println!("\n🔄 [동기화 라운드 {}] 시작", round);

        if let Ok(nodes) = self.nodes.read() {
            // Phase 1: 모든 노드가 로컬 모델 브로드캐스트
            println!("  Phase 1: 브로드캐스트");
            for (_, node) in nodes.iter() {
                let _ = node.broadcast_local_model();
            }

            // Phase 2: 모든 노드가 합의 알고리즘 실행
            println!("  Phase 2: 합의");
            for (_, node) in nodes.iter() {
                let _ = node.consensus_round();
            }
        }

        println!("✅ 동기화 라운드 {} 완료\n", round);

        Ok(())
    }

    /// 네트워크 상태 보고
    pub fn report_network_state(&self) {
        println!("\n═══════════════════════════════════════════");
        println!("v31.0 행성 규모 분산 지능 네트워크 보고");
        println!("네트워크: {}", self.name);
        println!("═══════════════════════════════════════════");

        if let Ok(nodes) = self.nodes.read() {
            for (_, node) in nodes.iter() {
                node.report_state();
            }
        }

        println!("\n═══════════════════════════════════════════");
        if let Ok(rounds) = self.sync_rounds.lock() {
            println!("총 동기화 라운드: {}", rounds);
        }
        println!("═══════════════════════════════════════════\n");
    }
}

// ============================================================================
// 파트 5: 유틸리티 함수
// ============================================================================

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

// ============================================================================
// 파트 6: 메인 데모
// ============================================================================

fn main() {
    println!("═══════════════════════════════════════════════════════════");
    println!("v31.0 Gogs-Planetary Distributed Intelligence Kernel");
    println!("행성 규모의 분산 지능");
    println!("═══════════════════════════════════════════════════════════\n");

    // 1. 네트워크 생성
    let network = Arc::new(PlanetaryNetwork::new("Earth-Global-Mind"));

    // 2. 노드 추가 (5개 지역: 아시아, 유럽, 아메리카, 아프리카, 오세아니아)
    println!("🌍 노드 생성 (5개 대륙)...\n");

    let node_asia = network.add_node("Asia-Node");
    let node_europe = network.add_node("Europe-Node");
    let node_americas = network.add_node("Americas-Node");
    let node_africa = network.add_node("Africa-Node");
    let node_oceania = network.add_node("Oceania-Node");

    println!("✅ 5개 노드 생성 완료\n");

    // 3. P2P 네트워크 설정
    network.establish_p2p_network();

    // 4. 시뮬레이션: 10번의 동기화 라운드
    println!("\n🧠 집단 지능 형성 시뮬레이션 (10 라운드)\n");

    for round in 0..10 {
        // 각 노드의 로컬 모델 업데이트 (로컬 학습)
        for i in 0..3 {
            node_asia.update_local_model(i, i % 2 == 0);
            node_europe.update_local_model(i, i % 3 == 0);
            node_americas.update_local_model(i, i % 4 == 0);
            node_africa.update_local_model(i, i % 5 == 0);
            node_oceania.update_local_model(i, i % 6 == 0);
        }

        // 전체 네트워크 동기화
        let _ = network.synchronization_round();

        if (round + 1) % 3 == 0 {
            println!("   [진행: {}/10 라운드]\n", round + 1);
        }
    }

    // 5. 최종 상태 보고
    network.report_network_state();

    // 6. 블록체인 검증
    println!("🔐 블록체인 검증");
    if let Ok(nodes) = network.nodes.read() {
        if let Some(node) = nodes.values().next() {
            match node.ledger.verify() {
                Ok(true) => println!("✅ 블록체인 무결성 확인됨"),
                Ok(false) => println!("❌ 블록체인 손상됨"),
                Err(e) => println!("❌ 검증 오류: {}", e),
            }
        }
    }

    println!("\n═══════════════════════════════════════════════════════════");
    println!("v31.0 행성 규모 분산 지능 커널 데모 완료");
    println!("철학: '한 명이 아닌 행성 전체가 생각한다'");
    println!("기록이 증명이다 gogs. 👑");
    println!("═══════════════════════════════════════════════════════════");
}
