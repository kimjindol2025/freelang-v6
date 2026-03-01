/**
 * FreeLang v7.4: Encapsulation & Access Control - 60 Tests
 *
 * 목표: 캡슐화와 정보 은닉을 통한 보안 성벽 검증
 * - Phase 1: 접근 제어자 정의 (20 tests)
 * - Phase 2: 접근 제어 강제화 (20 tests)
 * - Phase 3: 캡슐화 통합 (20 tests)
 */

import {
  ClassDef,
  ClassRegistry,
} from '../src/class-foundation';
import {
  ClassHierarchy,
} from '../src/class-inheritance';
import {
  AccessLevel,
  AccessModifierValidator,
  AccessValidator,
  EncapsulationChecker,
  MemberMetadata,
  AccessContext,
} from '../src/class-encapsulation';

describe('Phase 11.4: Encapsulation & Access Control', () => {
  let registry: ClassRegistry;
  let hierarchy: ClassHierarchy;
  let validator: AccessModifierValidator;
  let accessValidator: AccessValidator;
  let checker: EncapsulationChecker;

  beforeEach(() => {
    registry = new ClassRegistry();
    hierarchy = new ClassHierarchy();
    validator = new AccessModifierValidator();
    accessValidator = new AccessValidator(validator, hierarchy, registry);
    checker = new EncapsulationChecker(validator, accessValidator, hierarchy, registry);
  });

  describe('Phase 1: Access Modifier Definition (20 tests)', () => {
    test('1-1: AccessLevel enum (PRIVATE, PROTECTED, PUBLIC)', () => {
      expect(AccessLevel.PRIVATE).toBe(0);
      expect(AccessLevel.PROTECTED).toBe(1);
      expect(AccessLevel.PUBLIC).toBe(2);
    });

    test('1-2: MemberMetadata 정의', () => {
      const metadata: MemberMetadata = {
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      };
      expect(metadata.name).toBe('Balance');
      expect(metadata.type).toBe('field');
    });

    test('1-3: AccessModifierValidator 인스턴스 생성', () => {
      expect(validator).toBeDefined();
      expect(validator.getAllMembers('BankAccount')).toEqual([]);
    });

    test('1-4: 필드에 PRIVATE 플래그 부착', () => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      const member = validator.getMember('BankAccount', 'Balance');
      expect(member?.accessLevel).toBe(AccessLevel.PRIVATE);
    });

    test('1-5: 메서드에 PUBLIC 플래그 부착', () => {
      validator.registerMember({
        name: 'GetBalance',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      const member = validator.getMember('BankAccount', 'GetBalance');
      expect(member?.accessLevel).toBe(AccessLevel.PUBLIC);
    });

    test('1-6: PROTECTED 플래그 부착', () => {
      validator.registerMember({
        name: 'PIN',
        type: 'field',
        accessLevel: AccessLevel.PROTECTED,
        className: 'BankAccount',
      });
      const member = validator.getMember('BankAccount', 'PIN');
      expect(member?.accessLevel).toBe(AccessLevel.PROTECTED);
    });

    test('1-7: BankAccount.Balance (PRIVATE) 등록', () => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      const members = validator.getAllMembers('BankAccount');
      expect(members.length).toBe(1);
    });

    test('1-8: BankAccount.GetBalance (PUBLIC) 등록', () => {
      validator.registerMember({
        name: 'GetBalance',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      const member = validator.getMember('BankAccount', 'GetBalance');
      expect(member).toBeDefined();
    });

    test('1-9: 다중 필드 권한 설정', () => {
      const members: MemberMetadata[] = [
        { name: 'Balance', type: 'field', accessLevel: AccessLevel.PRIVATE, className: 'BankAccount' },
        { name: 'PIN', type: 'field', accessLevel: AccessLevel.PROTECTED, className: 'BankAccount' },
        { name: 'Account_Name', type: 'field', accessLevel: AccessLevel.PUBLIC, className: 'BankAccount' },
      ];
      for (const m of members) {
        validator.registerMember(m);
      }
      expect(validator.getAllMembers('BankAccount').length).toBe(3);
    });

    test('1-10: getMember() 권한 조회', () => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      const member = validator.getMember('BankAccount', 'Balance');
      expect(member?.accessLevel).toBe(AccessLevel.PRIVATE);
      expect(member?.type).toBe('field');
    });

    test('1-11: getAllMembers() 전체 멤버 조회', () => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'GetBalance',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      const all = validator.getAllMembers('BankAccount');
      expect(all.length).toBe(2);
    });

    test('1-12: 권한 메타데이터 보존', () => {
      const metadata: MemberMetadata = {
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
        isStatic: false,
      };
      validator.registerMember(metadata);
      const retrieved = validator.getMember('BankAccount', 'Balance');
      expect(retrieved?.isStatic).toBe(false);
    });

    test('1-13: 클래스별 멤버 격리 (BankAccount vs Customer)', () => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'Name',
        type: 'field',
        accessLevel: AccessLevel.PUBLIC,
        className: 'Customer',
      });
      expect(validator.getAllMembers('BankAccount').length).toBe(1);
      expect(validator.getAllMembers('Customer').length).toBe(1);
    });

    test('1-14: 메서드와 필드 구분', () => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'GetBalance',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      const field = validator.getMember('BankAccount', 'Balance');
      const method = validator.getMember('BankAccount', 'GetBalance');
      expect(field?.type).toBe('field');
      expect(method?.type).toBe('method');
    });

    test('1-15: 권한 수준 정확성 (0=PRIVATE, 1=PROTECTED, 2=PUBLIC)', () => {
      validator.registerMember({
        name: 'M1',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'Test',
      });
      validator.registerMember({
        name: 'M2',
        type: 'field',
        accessLevel: AccessLevel.PROTECTED,
        className: 'Test',
      });
      validator.registerMember({
        name: 'M3',
        type: 'field',
        accessLevel: AccessLevel.PUBLIC,
        className: 'Test',
      });
      expect(validator.getMember('Test', 'M1')?.accessLevel).toBe(0);
      expect(validator.getMember('Test', 'M2')?.accessLevel).toBe(1);
      expect(validator.getMember('Test', 'M3')?.accessLevel).toBe(2);
    });

    test('1-16: 중복 등록 처리', () => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      // 둘 다 등록됨 (나중 것이 추가됨)
      expect(validator.getAllMembers('BankAccount').length).toBe(2);
    });

    test('1-17: Static 멤버 플래그', () => {
      validator.registerMember({
        name: 'NextID',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
        isStatic: true,
      });
      const member = validator.getMember('BankAccount', 'NextID');
      expect(member?.isStatic).toBe(true);
    });

    test('1-18: 권한 변경 시나리오', () => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      // 새로 등록하면 변경 가능
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      const members = validator.getAllMembers('BankAccount');
      expect(members.length).toBe(2);
    });

    test('1-19: 빈 클래스 (멤버 없음)', () => {
      const members = validator.getAllMembers('EmptyClass');
      expect(members.length).toBe(0);
    });

    test('1-20: ✅ ACCESS MODIFIER DEFINITION COMPLETE', () => {
      const members: MemberMetadata[] = [
        { name: 'Balance', type: 'field', accessLevel: AccessLevel.PRIVATE, className: 'BankAccount' },
        { name: 'PIN', type: 'field', accessLevel: AccessLevel.PROTECTED, className: 'BankAccount' },
        { name: 'Account_Name', type: 'field', accessLevel: AccessLevel.PUBLIC, className: 'BankAccount' },
        { name: 'GetBalance', type: 'method', accessLevel: AccessLevel.PUBLIC, className: 'BankAccount' },
      ];
      for (const m of members) {
        validator.registerMember(m);
      }
      expect(validator.getAllMembers('BankAccount').length).toBe(4);
    });
  });

  describe('Phase 2: Access Control Enforcement (20 tests)', () => {
    beforeEach(() => {
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'PIN',
        type: 'field',
        accessLevel: AccessLevel.PROTECTED,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'Account_Name',
        type: 'field',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'GetBalance',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'Deposit',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
    });

    test('2-1: AccessValidator 인스턴스 생성', () => {
      expect(accessValidator).toBeDefined();
    });

    test('2-2: 내부 PRIVATE 필드 접근 (OK)', () => {
      const violation = accessValidator.validateAccess({
        accessingClass: 'BankAccount', // 내부에서 접근
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      });
      expect(violation).toBeNull(); // OK
    });

    test('2-3: 외부 PRIVATE 필드 접근 (ERROR)', () => {
      const violation = accessValidator.validateAccess({
        accessingClass: undefined, // 외부에서 접근
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      });
      expect(violation).not.toBeNull();
      expect(violation?.violationType).toBe('private_access');
    });

    test('2-4: **핵심 TEST 2-4: my_acc.Balance = 999 → ERROR ✅', () => {
      const violation = accessValidator.validateAccess({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      });
      expect(violation?.message).toContain('private');
      expect(violation?.message).toContain('only accessible within');
    });

    test('2-5: 외부 PUBLIC 필드 접근 (OK)', () => {
      const violation = accessValidator.validateAccess({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Account_Name',
      });
      expect(violation).toBeNull();
    });

    test('2-6: PROTECTED 필드: 자식클래스 접근 (OK)', () => {
      // 상속 관계 설정
      const parentDef: ClassDef = {
        name: 'BankAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const childDef: ClassDef = {
        name: 'SavingsAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(parentDef);
      registry.registerClass(childDef);
      hierarchy.extend('SavingsAccount', 'BankAccount');

      const violation = accessValidator.validateAccess({
        accessingClass: 'SavingsAccount',
        targetClass: 'BankAccount',
        targetMember: 'PIN',
      });
      expect(violation).toBeNull();
    });

    test('2-7: PROTECTED 필드: 외부 접근 (ERROR)', () => {
      const violation = accessValidator.validateAccess({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'PIN',
      });
      expect(violation?.violationType).toBe('protected_access');
    });

    test('2-8: AccessViolation 상세 정보', () => {
      const violation = accessValidator.validateAccess({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      });
      expect(violation?.targetClass).toBe('BankAccount');
      expect(violation?.targetMember).toBe('Balance');
      expect(violation?.requiredLevel).toBe(AccessLevel.PRIVATE);
    });

    test('2-9: PUBLIC 메서드 호출 (OK)', () => {
      const violation = accessValidator.validateAccess({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'GetBalance',
      });
      expect(violation).toBeNull();
    });

    test('2-10: PRIVATE 메서드 호출: 내부 (OK)', () => {
      validator.registerMember({
        name: 'Validate',
        type: 'method',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      const violation = accessValidator.validateAccess({
        accessingClass: 'BankAccount',
        targetClass: 'BankAccount',
        targetMember: 'Validate',
      });
      expect(violation).toBeNull();
    });

    test('2-11: PRIVATE 메서드 호출: 외부 (ERROR)', () => {
      validator.registerMember({
        name: 'Validate',
        type: 'method',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      const violation = accessValidator.validateAccess({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Validate',
      });
      expect(violation?.violationType).toBe('private_access');
    });

    test('2-12: PROTECTED 메서드: 자식 접근 (OK)', () => {
      const parentDef: ClassDef = {
        name: 'BankAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const childDef: ClassDef = {
        name: 'SavingsAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(parentDef);
      registry.registerClass(childDef);
      hierarchy.extend('SavingsAccount', 'BankAccount');

      validator.registerMember({
        name: 'CalculateInterest',
        type: 'method',
        accessLevel: AccessLevel.PROTECTED,
        className: 'BankAccount',
      });

      const violation = accessValidator.validateAccess({
        accessingClass: 'SavingsAccount',
        targetClass: 'BankAccount',
        targetMember: 'CalculateInterest',
      });
      expect(violation).toBeNull();
    });

    test('2-13: isAccessible() 간단 검증', () => {
      const isOk = accessValidator.isAccessible({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Account_Name',
      });
      expect(isOk).toBe(true);

      const isError = accessValidator.isAccessible({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      });
      expect(isError).toBe(false);
    });

    test('2-14: 접근 문맥 추적', () => {
      const context: AccessContext = {
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      };
      const violation = accessValidator.validateAccess(context);
      expect(violation?.context.accessingClass).toBeUndefined();
      expect(violation?.context.targetClass).toBe('BankAccount');
    });

    test('2-15: 다중 필드 접근 검증', () => {
      const violations = accessValidator.validateMultipleAccess(
        {
          accessingClass: undefined,
          targetClass: 'BankAccount',
          targetMember: 'Balance',
        },
        ['Balance', 'Account_Name']
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    test('2-16: 권한 위반 메시지 정확도', () => {
      const violation = accessValidator.validateAccess({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      });
      expect(violation?.message).toMatch(/private/i);
      expect(violation?.message).toMatch(/BankAccount/);
    });

    test('2-17: 상속 체인에서 접근 권한', () => {
      const parent: ClassDef = {
        name: 'Animal',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const child: ClassDef = {
        name: 'Dog',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(parent);
      registry.registerClass(child);
      hierarchy.extend('Dog', 'Animal');

      validator.registerMember({
        name: 'InternalMethod',
        type: 'method',
        accessLevel: AccessLevel.PROTECTED,
        className: 'Animal',
      });

      const violation = accessValidator.validateAccess({
        accessingClass: 'Dog',
        targetClass: 'Animal',
        targetMember: 'InternalMethod',
      });
      expect(violation).toBeNull();
    });

    test('2-18: 자식의 자식(손자) 접근 검증', () => {
      const grandParent: ClassDef = { name: 'A', fields: [], methods: [], totalSize: 0, registeredAt: Date.now() };
      const parent: ClassDef = { name: 'B', fields: [], methods: [], totalSize: 0, registeredAt: Date.now() };
      const child: ClassDef = { name: 'C', fields: [], methods: [], totalSize: 0, registeredAt: Date.now() };
      registry.registerClass(grandParent);
      registry.registerClass(parent);
      registry.registerClass(child);
      hierarchy.extend('B', 'A');
      hierarchy.extend('C', 'B');

      validator.registerMember({
        name: 'Protected_Method',
        type: 'method',
        accessLevel: AccessLevel.PROTECTED,
        className: 'A',
      });

      const violation = accessValidator.validateAccess({
        accessingClass: 'C',
        targetClass: 'A',
        targetMember: 'Protected_Method',
      });
      expect(violation).toBeNull();
    });

    test('2-19: Static 멤버 접근 제어', () => {
      validator.registerMember({
        name: 'NextID',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
        isStatic: true,
      });

      const violation = accessValidator.validateAccess({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'NextID',
      });
      expect(violation?.violationType).toBe('private_access');
    });

    test('2-20: ✅ ACCESS CONTROL ENFORCEMENT COMPLETE', () => {
      const goodAccess = accessValidator.isAccessible({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'GetBalance',
      });
      const badAccess = accessValidator.isAccessible({
        accessingClass: undefined,
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      });
      expect(goodAccess).toBe(true);
      expect(badAccess).toBe(false);
    });
  });

  describe('Phase 3: Encapsulation Integration (20 tests)', () => {
    beforeEach(() => {
      // ClassDef 객체 등록 (report 생성에 필요)
      const bankAccountDef: ClassDef = {
        name: 'BankAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(bankAccountDef);

      // 멤버 메타데이터 등록
      validator.registerMember({
        name: 'Balance',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'PIN',
        type: 'field',
        accessLevel: AccessLevel.PROTECTED,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'Account_Name',
        type: 'field',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'GetBalance',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
      validator.registerMember({
        name: 'Deposit',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'BankAccount',
      });
    });

    test('3-1: EncapsulationChecker 생성', () => {
      expect(checker).toBeDefined();
    });

    test('3-2: checkFieldAccess() 메서드', () => {
      const violation = checker.checkFieldAccess('BankAccount', 'Balance');
      expect(violation?.violationType).toBe('private_access');
    });

    test('3-3: checkMethodCall() 메서드', () => {
      const violation = checker.checkMethodCall('BankAccount', 'GetBalance');
      expect(violation).toBeNull();
    });

    test('3-4: getAllPublicMembers() 공개 멤버 필터링', () => {
      const publicMembers = checker.getAllPublicMembers('BankAccount');
      expect(publicMembers.length).toBe(3); // Account_Name, GetBalance, Deposit
    });

    test('3-5: getAllProtectedMembers() 보호 멤버 필터링', () => {
      const protectedMembers = checker.getAllProtectedMembers('BankAccount');
      expect(protectedMembers.length).toBe(1); // PIN
    });

    test('3-6: getAllPrivateMembers() 비공개 멤버 필터링', () => {
      const privateMembers = checker.getAllPrivateMembers('BankAccount');
      expect(privateMembers.length).toBe(1); // Balance
    });

    test('3-7: **TC_V7_4_ENCAPSULATION**: 캡슐화 전체 통합 테스트 ✅', () => {
      const publicInterface = checker.getPublicInterface('BankAccount');
      expect(publicInterface.length).toBe(3);

      const privateMembers = checker.getAllPrivateMembers('BankAccount');
      expect(privateMembers.length).toBe(1);

      const violation = checker.checkFieldAccess('BankAccount', 'Balance');
      expect(violation).not.toBeNull();
    });

    test('3-8: BankAccount 캡슐화 패턴', () => {
      const publicCount = checker.getAllPublicMembers('BankAccount').length;
      const privateCount = checker.getAllPrivateMembers('BankAccount').length;
      expect(publicCount).toBeGreaterThan(0);
      expect(privateCount).toBeGreaterThan(0);
    });

    test('3-9: Deposit (내부에서만 Balance 수정)', () => {
      const depositViolation = checker.checkMethodCall('BankAccount', 'Deposit', 'BankAccount');
      expect(depositViolation).toBeNull(); // 내부 호출 OK
    });

    test('3-10: GetBalance 공개 인터페이스', () => {
      const violation = checker.checkMethodCall('BankAccount', 'GetBalance');
      expect(violation).toBeNull();
    });

    test('3-11: 상속: SavingsAccount extends BankAccount', () => {
      const parent: ClassDef = {
        name: 'BankAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const child: ClassDef = {
        name: 'SavingsAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(parent);
      registry.registerClass(child);
      hierarchy.extend('SavingsAccount', 'BankAccount');
      expect(hierarchy.isSubclassOf('SavingsAccount', 'BankAccount')).toBe(true);
    });

    test('3-12: SavingsAccount에서 PROTECTED 필드 접근 (OK)', () => {
      const parent: ClassDef = {
        name: 'BankAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const child: ClassDef = {
        name: 'SavingsAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(parent);
      registry.registerClass(child);
      hierarchy.extend('SavingsAccount', 'BankAccount');

      const violation = accessValidator.validateAccess({
        accessingClass: 'SavingsAccount',
        targetClass: 'BankAccount',
        targetMember: 'PIN',
      });
      expect(violation).toBeNull();
    });

    test('3-13: SavingsAccount에서 PRIVATE 필드 접근 (ERROR)', () => {
      const parent: ClassDef = {
        name: 'BankAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      const child: ClassDef = {
        name: 'SavingsAccount',
        fields: [],
        methods: [],
        totalSize: 0,
        registeredAt: Date.now(),
      };
      registry.registerClass(parent);
      registry.registerClass(child);
      hierarchy.extend('SavingsAccount', 'BankAccount');

      const violation = accessValidator.validateAccess({
        accessingClass: 'SavingsAccount',
        targetClass: 'BankAccount',
        targetMember: 'Balance',
      });
      expect(violation?.violationType).toBe('private_access');
    });

    test('3-14: 다중 클래스 캡슐화', () => {
      validator.registerMember({
        name: 'ID',
        type: 'field',
        accessLevel: AccessLevel.PRIVATE,
        className: 'Customer',
      });
      validator.registerMember({
        name: 'Name',
        type: 'field',
        accessLevel: AccessLevel.PUBLIC,
        className: 'Customer',
      });

      const bankAccountPrivate = checker.getAllPrivateMembers('BankAccount');
      const customerPrivate = checker.getAllPrivateMembers('Customer');
      expect(bankAccountPrivate.length).toBeGreaterThan(0);
      expect(customerPrivate.length).toBeGreaterThan(0);
    });

    test('3-15: generateEncapsulationReport() 보고서', () => {
      const report = checker.generateEncapsulationReport();
      expect(report.totalClasses).toBeGreaterThan(0);
      expect(report.totalMembers).toBeGreaterThan(0);
    });

    test('3-16: 보고서: 공개/보호/비공개 멤버 통계', () => {
      const report = checker.generateEncapsulationReport();
      const bankAccount = report.summary.find((s) => s.className === 'BankAccount');
      expect(bankAccount?.publicCount).toBe(3);
      expect(bankAccount?.protectedCount).toBe(1);
      expect(bankAccount?.privateCount).toBe(1);
    });

    test('3-17: 권한 조합: public + protected + private', () => {
      const publicMembers = checker.getAllPublicMembers('BankAccount');
      const protectedMembers = checker.getAllProtectedMembers('BankAccount');
      const privateMembers = checker.getAllPrivateMembers('BankAccount');
      expect(publicMembers.length + protectedMembers.length + privateMembers.length).toBe(5);
    });

    test('3-18: 메서드 오버라이드 시 권한 유지', () => {
      validator.registerMember({
        name: 'GetBalance',
        type: 'method',
        accessLevel: AccessLevel.PUBLIC,
        className: 'SavingsAccount',
      });

      const parentMethod = validator.getMember('BankAccount', 'GetBalance');
      const childMethod = validator.getMember('SavingsAccount', 'GetBalance');
      expect(parentMethod?.accessLevel).toBe(childMethod?.accessLevel);
    });

    test('3-19: 인터페이스 구현과 캡슐화 호환', () => {
      const publicInterface = checker.getPublicInterface('BankAccount');
      expect(publicInterface.length).toBeGreaterThan(0);
      for (const member of publicInterface) {
        expect(member.accessLevel).toBe(AccessLevel.PUBLIC);
      }
    });

    test('3-20: ✅ TC_V7_4_ENCAPSULATION_COMPLETE', () => {
      const report = checker.generateEncapsulationReport();
      expect(report.totalClasses).toBeGreaterThan(0);

      const strength = checker.getEncapsulationStrength('BankAccount');
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(100);
    });
  });
});
