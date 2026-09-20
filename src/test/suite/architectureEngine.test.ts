import * as assert from 'assert';
import { ArchitectureEngine } from '../../core/architectureEngine';
import { ConfigResolver, DEFAULT_FSD_CONFIG } from '../../core/configResolver';

suite('Architecture Engine Tests', () => {
    test('Should flag cross-layer violation', () => {
        const fakeResolver = {
            getFsdConfig: () => DEFAULT_FSD_CONFIG
        } as ConfigResolver;

        const content = `import { Something } from "@/pages/Home";`;
        const violations = ArchitectureEngine.validateDocument(
            'C:/project/src/features/auth/index.ts',
            content,
            fakeResolver
        );

        assert.strictEqual(violations.length, 1);
        assert.ok(violations[0].message.includes('must not import from higher layer'));
    });

    test('Should allow correct layer imports', () => {
        const fakeResolver = {
            getFsdConfig: () => DEFAULT_FSD_CONFIG
        } as ConfigResolver;

        const content = `import { Button } from "@/shared/ui/Button";`;
        const violations = ArchitectureEngine.validateDocument(
            'C:/project/src/features/auth/index.ts',
            content,
            fakeResolver
        );

        assert.strictEqual(violations.length, 0);
    });

    test('Should identify Next.js app router files as highest layer', () => {
        const fakeResolver = {
            getFsdConfig: () => DEFAULT_FSD_CONFIG
        } as ConfigResolver;

        const content = `import { AuthFeature } from "@/features/auth";`;
        const violations = ArchitectureEngine.validateDocument(
            'C:/project/src/app/page.tsx',
            content,
            fakeResolver
        );

        // Next.js page.tsx can import from ANY layer without violations
        assert.strictEqual(violations.length, 0);
    });
});
