# 🧪 دليل الاختبارات (Testing Guide)

## 📋 نظرة عامة

هذا المجلد يحتوي على جميع اختبارات المشروع.

### البنية:
```
__tests__/
├── lib/               # Utility & library tests
│   ├── validators.test.ts
│   ├── logger.test.ts
│   └── rate-limit.test.ts
├── api/               # API route tests (TODO)
│   ├── auth.test.ts
│   └── orders.test.ts
├── components/        # Component tests (TODO)
│   └── ...
└── e2e/              # End-to-end tests (TODO)
    └── ...
```

---

## 🚀 تشغيل الاختبارات

### جميع الاختبارات:
```bash
npm test
```

### اختبارات محددة:
```bash
# ملف واحد
npm test validators.test.ts

# مجلد محدد
npm test __tests__/lib

# Pattern matching
npm test --testNamePattern="Rate Limiter"
```

### Watch Mode (للتطوير):
```bash
npm test -- --watch
```

### Coverage Report:
```bash
npm test -- --coverage
```

---

## 📊 Coverage Goals

### الهدف الحالي:
- ✅ **Statements:** 60%
- ✅ **Branches:** 60%
- ✅ **Functions:** 60%
- ✅ **Lines:** 60%

### الهدف المستقبلي:
- 🎯 **All:** 80%+

---

## ✅ ما تم اختباره

### ✅ Utilities:
- [x] Validators (Auth & Orders)
- [x] Logger (all methods)
- [x] Rate Limiter (core functionality)

### ⏳ قيد العمل:
- [ ] API Routes
  - [ ] Authentication endpoints
  - [ ] Orders endpoints
  - [ ] Quotations endpoints
- [ ] Components
  - [ ] Error Boundary
  - [ ] Dashboard components
  - [ ] Client portal
- [ ] Integration Tests
  - [ ] Full order workflow
  - [ ] Quotation workflow
  - [ ] Payment workflow

---

## 🔧 كتابة اختبارات جديدة

### Template للـ Unit Test:

```typescript
/**
 * Tests for YourModule
 */

import { yourFunction } from '@/lib/your-module';

describe('YourModule', () => {
  describe('yourFunction', () => {
    it('should do something correctly', () => {
      const result = yourFunction('input');
      expect(result).toBe('expected output');
    });

    it('should handle edge cases', () => {
      expect(() => yourFunction(null)).toThrow();
    });
  });
});
```

### Template للـ API Test:

```typescript
/**
 * Tests for API endpoint
 */

import { POST } from '@/app/api/your-endpoint/route';

describe('API /api/your-endpoint', () => {
  it('should return success response', async () => {
    const request = new Request('http://localhost/api/your-endpoint', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should validate input', async () => {
    const request = new Request('http://localhost/api/your-endpoint', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

---

## 🎯 Best Practices

### 1. Test Names (أسماء الاختبارات):
```typescript
// ✅ Good
it('should create order when data is valid')

// ❌ Bad
it('test order')
```

### 2. Arrange-Act-Assert Pattern:
```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [{ price: 10, quantity: 2 }];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(20);
});
```

### 3. Test One Thing:
```typescript
// ✅ Good - tests one concept
it('should validate email format')
it('should reject empty email')

// ❌ Bad - tests multiple things
it('should validate all fields')
```

### 4. Use Descriptive Assertions:
```typescript
// ✅ Good
expect(user.role).toBe('ADMIN');

// ✅ Better
expect(user).toMatchObject({
  role: 'ADMIN',
  active: true,
});
```

### 5. Clean Up After Tests:
```typescript
afterEach(() => {
  jest.clearAllMocks();
  // Clean up test data
});
```

---

## 🐛 Debugging Tests

### Run Single Test:
```bash
npm test -- -t "should validate email"
```

### Run with Console Output:
```bash
npm test -- --verbose
```

### Debug in VSCode:
1. Add breakpoint في الكود
2. Open "Run and Debug" panel (Ctrl+Shift+D)
3. Select "Jest: Run Current File"
4. Press F5

---

## 📈 Continuous Integration

### Pre-commit Hook:
```bash
# في .husky/pre-commit
npm test
```

### CI Pipeline (GitHub Actions):
```yaml
- name: Run tests
  run: npm test -- --coverage
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

## 🎓 مصادر إضافية

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Test Best Practices](https://testingjavascript.com/)

---

## 📊 Current Stats

```
Tests Suites: 3 passed
Tests:        30+ passed
Coverage:     ~40% (target: 60%)
Time:         < 5 seconds
```

---

## 🎯 Next Steps

1. ✅ Complete utility tests
2. ⏳ Add API route tests (in progress)
3. ⏳ Add component tests
4. ⏳ Add integration tests
5. ⏳ Reach 60% coverage
6. ⏳ Setup CI/CD

**Current Progress: 25% → Target: 60%**

---

**Happy Testing! 🚀**

