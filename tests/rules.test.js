import { RuleTester } from 'eslint';
import * as parser from '../src/ampscript-parser.js';

// ── AMPscript rule imports ────────────────────────────────────────────────────

import ampNoUnknownFunction from '../src/rules/amp/no-unknown-function.js';
import ampNoHtmlComment from '../src/rules/amp/no-html-comment.js';
import ampNoJsLineComment from '../src/rules/amp/no-js-line-comment.js';
import ampNoNestedScriptTag from '../src/rules/amp/no-nested-script-tag.js';
import ampNoNestedAmpscriptDelimiter from '../src/rules/amp/no-nested-ampscript-delimiter.js';
import ampNoVariableRedeclaration from '../src/rules/amp/no-var-redeclaration.js';
import ampSetRequiresTarget from '../src/rules/amp/set-requires-target.js';
import ampNoEmptyBlock from '../src/rules/amp/no-empty-block.js';
import ampNoSmartQuotes from '../src/rules/amp/no-smart-quotes.js';
import ampPreferAttributeValue from '../src/rules/amp/prefer-attribute-value.js';
import ampNoLoopCounterAssign from '../src/rules/amp/no-loop-counter-assign.js';
import ampNoInlineStatement from '../src/rules/amp/no-inline-statement.js';
import ampRequireVariableDeclaration from '../src/rules/amp/require-variable-declaration.js';
import ampFunctionArity from '../src/rules/amp/function-arity.js';
import ampNoEmailExcludedFunction from '../src/rules/amp/no-email-excluded-function.js';
import ampNoDeprecatedFunction from '../src/rules/amp/no-deprecated-function.js';
import ampNamingConvention from '../src/rules/amp/naming-convention.js';
import ampNoEmptyThen from '../src/rules/amp/no-empty-then.js';
import ampRequireRowcountCheck from '../src/rules/amp/require-rowcount-check.js';

// ── SSJS rule imports ─────────────────────────────────────────────────────────

import ssjsRequirePlatformLoad from '../src/rules/ssjs/require-platform-load.js';
import ssjsNoUnsupportedSyntax from '../src/rules/ssjs/no-unsupported-syntax.js';
import ssjsNoUnknownPlatformFunction from '../src/rules/ssjs/no-unknown-platform-function.js';
import ssjsNoUnknownCoreMethod from '../src/rules/ssjs/no-unknown-core-method.js';
import ssjsPlatformFunctionArity from '../src/rules/ssjs/platform-function-arity.js';
import ssjsNoUnknownHttpMethod from '../src/rules/ssjs/no-unknown-http-method.js';
import ssjsNoUnknownWsproxyMethod from '../src/rules/ssjs/no-unknown-wsproxy-method.js';
import ssjsNoUnknownPlatformVariable from '../src/rules/ssjs/no-unknown-platform-variable.js';
import ssjsNoUnknownPlatformResponse from '../src/rules/ssjs/no-unknown-platform-response.js';
import ssjsNoUnknownPlatformRequest from '../src/rules/ssjs/no-unknown-platform-request.js';
import ssjsCacheLoopLength from '../src/rules/ssjs/cache-loop-length.js';
import ssjsRequireHasownproperty from '../src/rules/ssjs/require-hasownproperty.js';
import ssjsRequirePlatformLoadOrder from '../src/rules/ssjs/require-platform-load-order.js';
import ssjsNoHardcodedCredentials from '../src/rules/ssjs/no-hardcoded-credentials.js';
import ssjsPreferPlatformLoadVersion from '../src/rules/ssjs/prefer-platform-load-version.js';
import ssjsNoUnavailableMethod from '../src/rules/ssjs/no-unavailable-method.js';
import ssjsPreferParsejsonSafeArg from '../src/rules/ssjs/prefer-parsejson-safe-arg.js';
import ssjsNoSwitchDefault from '../src/rules/ssjs/no-switch-default.js';
import ssjsNoTreatAsContentInjection from '../src/rules/ssjs/no-treatascontent-injection.js';

// ── Processor imports ─────────────────────────────────────────────────────────

import { preprocess, postprocess } from '../src/processor.js';

// ── AMPscript RuleTester ──────────────────────────────────────────────────────

const ampTester = new RuleTester({
    languageOptions: { parser },
});

// ── 1. amp-no-unknown-function ────────────────────────────────────────────────

ampTester.run('amp-no-unknown-function', ampNoUnknownFunction, {
    valid: [
        { code: '%%[set @x = Lookup("DE", "F", "K", @v)]%%' },
        { code: '%%= V(@name) =%%' },
        { code: '%%[set @x = Trim("  hello  ")]%%' },
        { code: '%%= Now() =%%' },
    ],
    invalid: [
        {
            code: '%%[set @x = FooBar(@v)]%%',
            errors: [{ messageId: 'unknownFunction', data: { name: 'FooBar' } }],
        },
        {
            code: '%%[set @x = MyCustomFunc(1, 2)]%%',
            errors: [{ messageId: 'unknownFunction', data: { name: 'MyCustomFunc' } }],
        },
    ],
});

// ── 2. amp-no-var-redeclaration ───────────────────────────────────────────────

ampTester.run('amp-no-var-redeclaration', ampNoVariableRedeclaration, {
    valid: [
        { code: '%%[var @x\nvar @y]%%' },
        { code: '%%[var @firstName, @lastName]%%' },
        { code: '%%[var @a\nset @a = 1\nvar @b]%%' },
    ],
    invalid: [
        {
            code: '%%[var @x\nvar @x]%%',
            errors: [{ messageId: 'redeclared', data: { name: '@x' } }],
        },
        {
            code: '%%[var @Name\nvar @name]%%',
            errors: [{ messageId: 'redeclared', data: { name: '@name' } }],
        },
    ],
});

// ── 3. amp-set-requires-target ────────────────────────────────────────────────

ampTester.run('amp-set-requires-target', ampSetRequiresTarget, {
    valid: [{ code: '%%[set @x = 1]%%' }, { code: '%%[set @name = "hello"]%%' }],
    invalid: [
        {
            code: '%%[set = 1]%%',
            errors: [{ messageId: 'missingTarget' }],
        },
        {
            code: '%%[set = "hello"]%%',
            errors: [{ messageId: 'missingTarget' }],
        },
    ],
});

// ── 4. amp-no-empty-block ─────────────────────────────────────────────────────

ampTester.run('amp-no-empty-block', ampNoEmptyBlock, {
    valid: [{ code: '%%[set @x = 1]%%' }, { code: '%%[var @x]%%' }, { code: '%%= V(@x) =%%' }],
    invalid: [
        {
            code: '%%[]%%',
            errors: [
                {
                    messageId: 'emptyBlock',
                    suggestions: [{ messageId: 'removeEmptyBlock', output: '' }],
                },
            ],
        },
        {
            code: '%%[/* just a comment */]%%',
            errors: [
                {
                    messageId: 'emptyBlock',
                    suggestions: [{ messageId: 'removeEmptyBlock', output: '' }],
                },
            ],
        },
    ],
});

// ── 5. amp-no-smart-quotes ────────────────────────────────────────────────────

ampTester.run('amp-no-smart-quotes', ampNoSmartQuotes, {
    valid: [
        { code: '%%[set @x = "hello"]%%' },
        { code: "%%[set @x = 'world']%%" },
        { code: '%%[set @x = "it\'s fine"]%%' },
    ],
    invalid: [
        {
            // right single curly ' inside a "-delimited string — replace with straight '
            code: '%%[set @x = "he\u2019s here"]%%',
            output: '%%[set @x = "he\'s here"]%%',
            errors: [
                {
                    messageId: 'smartQuote',
                    data: { kind: 'right single curly quote \u2019' },
                },
            ],
        },
        {
            // double curly quotes inside a "-delimited string — switch outer to '
            code: '%%[set @x = "\u201Chello\u201D"]%%',
            output: "%%[set @x = '\"hello\"']%%",
            errors: [
                {
                    messageId: 'smartQuote',
                    data: { kind: 'left double curly quote \u201C' },
                },
            ],
        },
    ],
});

// ── 6. amp-prefer-attribute-value ─────────────────────────────────────────────

ampTester.run('amp-prefer-attribute-value', ampPreferAttributeValue, {
    valid: [
        { code: '%%[set @x = AttributeValue("firstname")]%%' },
        { code: '%%[set @x = V(@name)]%%' },
        { code: '%%[set @x = Lookup("DE", "F", "K", @v)]%%' },
        { code: '%%[set @x = 42]%%' },
        { code: '%%[set @x = "hello"]%%' },
    ],
    invalid: [
        {
            code: '%%[set @x = firstname]%%',
            errors: [
                {
                    messageId: 'preferAttributeValue',
                    data: { name: 'firstname' },
                    suggestions: [
                        {
                            messageId: 'wrapWithAttributeValue',
                            data: { name: 'firstname' },
                            output: '%%[set @x = AttributeValue("firstname")]%%',
                        },
                    ],
                },
            ],
        },
        {
            code: '%%[set @x = emailaddr]%%',
            errors: [
                {
                    messageId: 'preferAttributeValue',
                    data: { name: 'emailaddr' },
                    suggestions: [
                        {
                            messageId: 'wrapWithAttributeValue',
                            data: { name: 'emailaddr' },
                            output: '%%[set @x = AttributeValue("emailaddr")]%%',
                        },
                    ],
                },
            ],
        },
    ],
});

// ── 7. amp-no-loop-counter-assign ─────────────────────────────────────────────

ampTester.run('amp-no-loop-counter-assign', ampNoLoopCounterAssign, {
    valid: [
        {
            code: '%%[for @i = 1 to 10 do\nset @y = V(@i)\nnext @i]%%',
        },
        {
            code: '%%[for @i = 1 to 5 do\nset @name = Field(Row(@rows, @i), "Name")\nnext @i]%%',
        },
    ],
    invalid: [
        {
            code: '%%[for @i = 1 to 10 do\nset @i = 5\nnext @i]%%',
            errors: [{ messageId: 'counterAssign', data: { name: '@i' } }],
        },
        {
            code: '%%[for @cnt = 1 to 10 do\nset @cnt = Add(@cnt, 2)\nnext @cnt]%%',
            errors: [{ messageId: 'counterAssign', data: { name: '@cnt' } }],
        },
    ],
});

// ── 8. amp-no-inline-statement ────────────────────────────────────────────────

ampTester.run('amp-no-inline-statement', ampNoInlineStatement, {
    valid: [
        { code: '%%= V(@name) =%%' },
        { code: '%%= Lookup("DE", "F", "K", @v) =%%' },
        { code: '%%= Trim(@val) =%%' },
    ],
    invalid: [
        {
            code: '%%= set @x = 1 =%%',
            errors: [{ messageId: 'inlineStatement', data: { kind: 'SetStatement' } }],
        },
        {
            code: '%%= var @x =%%',
            errors: [{ messageId: 'inlineStatement', data: { kind: 'VarDeclaration' } }],
        },
    ],
});

// ── 9. amp-require-variable-declaration ───────────────────────────────────────

ampTester.run('amp-require-variable-declaration', ampRequireVariableDeclaration, {
    valid: [
        { code: '%%[var @x\nset @x = 1]%%' },
        { code: '%%[var @a, @b\nset @a = 1\nset @b = 2]%%' },
        { code: '%%[set @@rowcount = 1]%%' },
    ],
    invalid: [
        {
            code: '%%[set @x = 1]%%',
            errors: [{ messageId: 'undeclared', data: { name: '@x' } }],
        },
        {
            code: '%%[var @a\nset @b = 2]%%',
            errors: [{ messageId: 'undeclared', data: { name: '@b' } }],
        },
    ],
});

// ── 10. amp-function-arity ────────────────────────────────────────────────────

ampTester.run('amp-function-arity', ampFunctionArity, {
    valid: [
        { code: '%%= V(@x) =%%' },
        { code: '%%= Now() =%%' },
        { code: '%%= Add(1, 2) =%%' },
        { code: '%%[set @x = Lookup("DE", "Ret", "Key", @val)]%%' },
        { code: '%%= Concat("a", "b", "c") =%%' },
    ],
    invalid: [
        {
            code: '%%= V() =%%',
            errors: [
                {
                    messageId: 'tooFewArgs',
                    data: { name: 'V', min: '1', actual: '0' },
                },
            ],
        },
        {
            code: '%%= V(@x, @y) =%%',
            errors: [
                {
                    messageId: 'tooManyArgs',
                    data: { name: 'V', max: '1', actual: '2' },
                },
            ],
        },
        {
            code: '%%= Add(1) =%%',
            errors: [
                {
                    messageId: 'tooFewArgs',
                    data: { name: 'Add', min: '2', actual: '1' },
                },
            ],
        },
        {
            code: '%%= Add(1, 2, 3) =%%',
            errors: [
                {
                    messageId: 'tooManyArgs',
                    data: { name: 'Add', max: '2', actual: '3' },
                },
            ],
        },
    ],
});

// ── 11. amp-no-email-excluded-function ────────────────────────────────────────

ampTester.run('amp-no-email-excluded-function', ampNoEmailExcludedFunction, {
    valid: [
        {
            code: '%%[set @x = Lookup("DE", "F", "K", @v)]%%',
            options: [{ context: 'email' }],
        },
        {
            code: '%%= V(@name) =%%',
            options: [{ context: 'email' }],
        },
        {
            code: '%%[InsertData("DE", "Col", @val)]%%',
            options: [{ context: 'cloudpage' }],
        },
        {
            code: '%%[Redirect("https://example.com")]%%',
            options: [{ context: 'cloudpage' }],
        },
    ],
    invalid: [
        {
            code: '%%[InsertData("DE", "Col", @val)]%%',
            options: [{ context: 'email' }],
            errors: [{ messageId: 'emailExcluded', data: { name: 'InsertData' } }],
        },
        {
            code: '%%[UpdateData("DE", 1, "Key", @k, "Col", @v)]%%',
            options: [{ context: 'email' }],
            errors: [{ messageId: 'emailExcluded', data: { name: 'UpdateData' } }],
        },
        {
            code: '%%[Redirect("https://example.com")]%%',
            options: [{ context: 'email' }],
            errors: [{ messageId: 'emailExcluded', data: { name: 'Redirect' } }],
        },
        {
            code: '%%[set @p = RequestParameter("id")]%%',
            options: [{ context: 'email' }],
            errors: [
                {
                    messageId: 'emailExcluded',
                    data: { name: 'RequestParameter' },
                },
            ],
        },
    ],
});

// ── 12. amp-no-deprecated-function ────────────────────────────────────────────

ampTester.run('amp-no-deprecated-function', ampNoDeprecatedFunction, {
    valid: [
        { code: '%%[set @x = Lookup("DE", "F", "K", @v)]%%' },
        { code: '%%[InsertData("DE", "Col", @val)]%%' },
    ],
    invalid: [
        {
            // 1:1 replacement — auto-fix renames the function in-place
            code: '%%[set @x = LookupValue("DE", "F", "K", @v)]%%',
            output: '%%[set @x = Lookup("DE", "F", "K", @v)]%%',
            errors: [
                {
                    messageId: 'deprecated',
                    data: {
                        name: 'LookupValue',
                        replacement: 'Lookup',
                        reason: 'LookupValue was the original name; Lookup is the current standard.',
                    },
                },
            ],
        },
        {
            code: '%%[InsertDE("DE", "Col", @val)]%%',
            output: '%%[InsertData("DE", "Col", @val)]%%',
            errors: [
                {
                    messageId: 'deprecated',
                    data: {
                        name: 'InsertDE',
                        replacement: 'InsertData',
                        reason: 'InsertDE is a legacy alias for InsertData.',
                    },
                },
            ],
        },
        {
            // Ambiguous replacement — two manual suggestions instead of auto-fix
            code: '%%[ContentArea(123)]%%',
            errors: [
                {
                    messageId: 'deprecated',
                    data: {
                        name: 'ContentArea',
                        replacement: 'ContentBlockByKey or ContentBlockByName',
                        reason: 'ContentArea references classic content areas which are being phased out in favor of Content Builder.',
                    },
                    suggestions: [
                        {
                            messageId: 'replaceWith',
                            data: { name: 'ContentArea', replacement: 'ContentBlockByKey' },
                            output: '%%[ContentBlockByKey(123)]%%',
                        },
                        {
                            messageId: 'replaceWith',
                            data: { name: 'ContentArea', replacement: 'ContentBlockByName' },
                            output: '%%[ContentBlockByName(123)]%%',
                        },
                    ],
                },
            ],
        },
    ],
});

// ── 13. amp-naming-convention ─────────────────────────────────────────────────

ampTester.run('amp-naming-convention', ampNamingConvention, {
    valid: [
        { code: '%%[var @firstName]%%' },
        { code: '%%[var @x]%%' },
        { code: '%%[var @myLongVariableName]%%' },
        {
            code: '%%[var @FirstName]%%',
            options: [{ format: 'PascalCase' }],
        },
        {
            code: '%%[var @MyVar]%%',
            options: [{ format: 'PascalCase' }],
        },
        { code: '%%[set @@rowcount = 1]%%' },
    ],
    invalid: [
        {
            code: '%%[var @FirstName]%%',
            errors: [
                {
                    messageId: 'badName',
                    data: { name: '@FirstName', format: 'camelCase' },
                },
            ],
        },
        {
            code: '%%[var @my_var]%%',
            errors: [
                {
                    messageId: 'badName',
                    data: { name: '@my_var', format: 'camelCase' },
                },
            ],
        },
        {
            code: '%%[var @firstName]%%',
            options: [{ format: 'PascalCase' }],
            errors: [
                {
                    messageId: 'badName',
                    data: { name: '@firstName', format: 'PascalCase' },
                },
            ],
        },
    ],
});

// ── 14. amp-no-empty-then ─────────────────────────────────────────────────────

ampTester.run('amp-no-empty-then', ampNoEmptyThen, {
    valid: [
        {
            code: '%%[if @x == 1 then\nset @y = 2\nendif]%%',
        },
        {
            code: '%%[if @x == 1 then\nset @y = 2\nelse\nset @y = 3\nendif]%%',
        },
    ],
    invalid: [
        {
            code: '%%[if @x == 1 then\nendif]%%',
            errors: [{ messageId: 'emptyThen' }],
        },
        {
            code: '%%[if @x == 1 then\nelse\nset @y = 3\nendif]%%',
            errors: [{ messageId: 'emptyThen' }],
        },
    ],
});

// ── 15. amp-require-rowcount-check ────────────────────────────────────────────

ampTester.run('amp-require-rowcount-check', ampRequireRowcountCheck, {
    valid: [
        {
            code: [
                '%%[',
                '  set @rows = LookupRows("DE", "Col", @val)',
                '  if RowCount(@rows) > 0 then',
                '    for @i = 1 to RowCount(@rows) do',
                '      set @name = Field(Row(@rows, @i), "Name")',
                '    next @i',
                '  endif',
                ']%%',
            ].join('\n'),
        },
        {
            code: '%%[for @i = 1 to 10 do\nset @x = V(@i)\nnext @i]%%',
        },
    ],
    invalid: [
        {
            code: [
                '%%[',
                '  set @rows = LookupRows("DE", "Col", @val)',
                '  for @i = 1 to RowCount(@rows) do',
                '    set @name = Field(Row(@rows, @i), "Name")',
                '  next @i',
                ']%%',
            ].join('\n'),
            errors: [{ messageId: 'missingRowCount', data: { name: '@rows' } }],
        },
        {
            code: [
                '%%[',
                '  set @data = LookupOrderedRows("DE", 10, "Col asc", "Key", @val)',
                '  for @j = 1 to RowCount(@data) do',
                '    set @v = Field(Row(@data, @j), "Name")',
                '  next @j',
                ']%%',
            ].join('\n'),
            errors: [{ messageId: 'missingRowCount', data: { name: '@data' } }],
        },
    ],
});

console.log('All AMPscript rule tests passed.');

// ═══════════════════════════════════════════════════════════════════════════════
// SSJS Rule Tests
// ═══════════════════════════════════════════════════════════════════════════════

const ssjsTester = new RuleTester({
    languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
});

const ssjsModuleTester = new RuleTester({
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

// ─── 1. ssjs-require-platform-load ────────────────────────────────────────────

ssjsTester.run('ssjs-require-platform-load', ssjsRequirePlatformLoad, {
    valid: [
        {
            code: 'Platform.Load("core", "1"); var de = DataExtension.Init("MyDE");',
        },
        {
            code: 'Platform.Load("Core", "1"); Subscriber.Init("sub");',
        },
        {
            code: 'var x = 1 + 2;',
        },
        {
            code: 'Platform.Load("core","1"); var rows = DataExtension.Rows.Init("DE"); rows.Retrieve();',
        },
    ],
    invalid: [
        {
            // Single violation — fix inserts Platform.Load at the top
            code: 'var de = DataExtension.Init("MyDE");',
            output: 'Platform.Load("core", "1.1.5");\nvar de = DataExtension.Init("MyDE");',
            errors: [{ messageId: 'missingLoad' }],
        },
        {
            // Multiple violations — fix is only applied to the first one
            code: 'Subscriber.Init("sub1"); Email.Init("email1");',
            output: 'Platform.Load("core", "1.1.5");\nSubscriber.Init("sub1"); Email.Init("email1");',
            errors: [{ messageId: 'missingLoad' }, { messageId: 'missingLoad' }],
        },
        {
            code: 'var rows = DataExtension.Rows.Init("MyDE");',
            output: 'Platform.Load("core", "1.1.5");\nvar rows = DataExtension.Rows.Init("MyDE");',
            errors: [{ messageId: 'missingLoad' }],
        },
    ],
});

// ─── 2. ssjs-no-unsupported-syntax ────────────────────────────────────────────

ssjsTester.run('ssjs-no-unsupported-syntax', ssjsNoUnsupportedSyntax, {
    valid: [
        { code: 'var x = 1;' },
        { code: 'function foo() { return 1; }' },
        { code: 'var s = "hello " + name;' },
        { code: 'for (var i = 0; i < 10; i++) {}' },
    ],
    invalid: [
        {
            code: 'var fn = () => 1;',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            // let -> var: auto-fix
            code: 'let x = 1;',
            output: 'var x = 1;',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            // const -> var: auto-fix
            code: 'const y = 2;',
            output: 'var y = 2;',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            code: 'var s = `hello ${name}`;',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            code: 'for (var x of arr) {}',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            code: 'function foo(a = 1) {}',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            // ?? -> || suggestion (not auto-fixed due to differing semantics)
            code: 'var x = a ?? b;',
            errors: [
                {
                    messageId: 'unsupported',
                    suggestions: [
                        {
                            messageId: 'suggestLogicalOr',
                            output: 'var x = a || b;',
                        },
                    ],
                },
            ],
        },
    ],
});

ssjsModuleTester.run('ssjs-no-unsupported-syntax (module)', ssjsNoUnsupportedSyntax, {
    valid: [],
    invalid: [
        {
            code: 'import foo from "bar";',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            code: 'export var x = 1;',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            code: 'export default function() {}',
            errors: [{ messageId: 'unsupported' }],
        },
    ],
});

// ─── 3. ssjs-no-unknown-platform-function ─────────────────────────────────────

ssjsTester.run('ssjs-no-unknown-platform-function', ssjsNoUnknownPlatformFunction, {
    valid: [
        { code: 'Platform.Function.Lookup("DE", "Field", "Key", "Val");' },
        { code: 'Platform.Function.InsertData("DE", "Col", "Val");' },
        { code: 'Platform.Function.Now();' },
        { code: 'var rows = Platform.Function.LookupRows("DE", "K", "V");' },
    ],
    invalid: [
        {
            code: 'Platform.Function.DoSomethingFake();',
            errors: [{ messageId: 'unknownFunction' }],
        },
        {
            code: 'Platform.Function.FetchRows();',
            errors: [{ messageId: 'unknownFunction' }],
        },
        {
            code: 'Platform.Function.Query("SELECT 1");',
            errors: [{ messageId: 'unknownFunction' }],
        },
    ],
});

// ─── 4. ssjs-no-unknown-core-method ───────────────────────────────────────────

ssjsTester.run('ssjs-no-unknown-core-method', ssjsNoUnknownCoreMethod, {
    valid: [
        {
            code: 'var de = DataExtension.Init("MyDE"); de.Retrieve();',
        },
        {
            code: 'var sub = Subscriber.Init("s"); sub.Add();',
        },
        {
            code: 'var ts = TriggeredSend.Init("ts"); ts.Send();',
        },
        {
            code: 'var x = somethingElse(); x.Anything();',
        },
    ],
    invalid: [
        {
            code: 'var de = DataExtension.Init("MyDE"); de.Execute();',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'var sub = Subscriber.Init("s"); sub.Send();',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'var e = Email.Init("e"); e.Foo();',
            errors: [{ messageId: 'unknownMethod' }],
        },
    ],
});

// ─── 5. ssjs-platform-function-arity ──────────────────────────────────────────

ssjsTester.run('ssjs-platform-function-arity', ssjsPlatformFunctionArity, {
    valid: [
        {
            code: 'Platform.Function.Lookup("DE", "Field", "Key", "Val");',
        },
        {
            code: 'Platform.Function.Now();',
        },
        {
            code: 'Platform.Function.Trim("hello");',
        },
        {
            code: 'Platform.Function.Substring("hello", 0, 3);',
        },
    ],
    invalid: [
        {
            code: 'Platform.Function.Lookup();',
            errors: [{ messageId: 'tooFewArgs' }],
        },
        {
            code: 'Platform.Function.Now("extra");',
            errors: [{ messageId: 'tooManyArgs' }],
        },
        {
            code: 'Platform.Function.Trim("a", "b");',
            errors: [{ messageId: 'tooManyArgs' }],
        },
    ],
});

// ─── 6. ssjs-no-unknown-http-method ───────────────────────────────────────────

ssjsTester.run('ssjs-no-unknown-http-method', ssjsNoUnknownHttpMethod, {
    valid: [
        { code: 'HTTP.Get("https://example.com");' },
        { code: 'HTTP.Post("https://example.com", "application/json", "{}");' },
        { code: 'HTTP.GetRequest();' },
        { code: 'HTTP.PostRequest();' },
    ],
    invalid: [
        {
            code: 'HTTP.Put("https://example.com");',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'HTTP.Delete("https://example.com");',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'HTTP.Patch("https://example.com");',
            errors: [{ messageId: 'unknownMethod' }],
        },
    ],
});

// ─── 7. ssjs-no-unknown-wsproxy-method ────────────────────────────────────────

ssjsTester.run('ssjs-no-unknown-wsproxy-method', ssjsNoUnknownWsproxyMethod, {
    valid: [
        {
            code: 'var api = new WSProxy(); api.retrieve("DataExtension", ["Name"], {});',
        },
        {
            code: "var api = new WSProxy(); api.createItem('DataExtension', {});",
        },
        {
            code: 'var api = new WSProxy(); api.setClientId(12345);',
        },
        {
            code: 'someObj.unknownMethod();',
        },
    ],
    invalid: [
        {
            code: 'var api = new WSProxy(); api.query();',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'var api = new WSProxy(); api.fetch();',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'var proxy = new WSProxy(); proxy.send();',
            errors: [{ messageId: 'unknownMethod' }],
        },
    ],
});

// ─── 8. ssjs-no-unknown-platform-variable ─────────────────────────────────────

ssjsTester.run('ssjs-no-unknown-platform-variable', ssjsNoUnknownPlatformVariable, {
    valid: [
        { code: 'Platform.Variable.GetValue("myVar");' },
        { code: 'Platform.Variable.SetValue("myVar", "val");' },
        { code: 'var x = 1;' },
    ],
    invalid: [
        {
            code: 'Platform.Variable.Delete("myVar");',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'Platform.Variable.Lookup();',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'Platform.Variable.Clear();',
            errors: [{ messageId: 'unknownMethod' }],
        },
    ],
});

// ─── 9. ssjs-no-unknown-platform-response ─────────────────────────────────────

ssjsTester.run('ssjs-no-unknown-platform-response', ssjsNoUnknownPlatformResponse, {
    valid: [
        { code: 'Platform.Response.GetResponseHeader("Content-Type");' },
        { code: 'Platform.Response.SetResponseHeader("X-Custom", "val");' },
        { code: 'Platform.Response.Redirect("https://example.com");' },
        { code: 'Platform.Response.Write("<h1>Hello</h1>");' },
    ],
    invalid: [
        {
            code: 'Platform.Response.Send("data");',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'Platform.Response.Flush();',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'Platform.Response.End();',
            errors: [{ messageId: 'unknownMethod' }],
        },
    ],
});

// ─── 10. ssjs-no-unknown-platform-request ─────────────────────────────────────

ssjsTester.run('ssjs-no-unknown-platform-request', ssjsNoUnknownPlatformRequest, {
    valid: [
        { code: 'Platform.Request.GetQueryStringParameter("id");' },
        { code: 'Platform.Request.GetFormData("email");' },
        { code: 'Platform.Request.GetPostData();' },
        { code: 'Platform.Request.HasSSL();' },
        { code: 'Platform.Request.Method();' },
        { code: 'Platform.Request.RequestURL();' },
    ],
    invalid: [
        {
            code: 'Platform.Request.GetHeader();',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'Platform.Request.GetCookie();',
            errors: [{ messageId: 'unknownMethod' }],
        },
        {
            code: 'Platform.Request.Body();',
            errors: [{ messageId: 'unknownMethod' }],
        },
    ],
});

// ─── 11. ssjs-cache-loop-length ───────────────────────────────────────────────

ssjsTester.run('ssjs-cache-loop-length', ssjsCacheLoopLength, {
    valid: [
        {
            code: 'for (var i = 0, len = arr.length; i < len; i++) {}',
        },
        {
            code: 'for (var i = 0; i < 10; i++) {}',
        },
        {
            code: 'for (var i = 0; i < max; i++) {}',
        },
        {
            code: 'while (i < arr.length) { i++; }',
        },
    ],
    invalid: [
        {
            code: 'for (var i = 0; i < arr.length; i++) {}',
            errors: [
                {
                    messageId: 'cacheLength',
                    suggestions: [
                        {
                            messageId: 'suggestCacheLength',
                            data: { obj: 'arr' },
                            output: 'for (var i = 0, _len = arr.length; i < _len; i++) {}',
                        },
                    ],
                },
            ],
        },
        {
            code: 'for (var i = 0; i < rows.length; i++) {}',
            errors: [
                {
                    messageId: 'cacheLength',
                    suggestions: [
                        {
                            messageId: 'suggestCacheLength',
                            data: { obj: 'rows' },
                            output: 'for (var i = 0, _len = rows.length; i < _len; i++) {}',
                        },
                    ],
                },
            ],
        },
    ],
});

// ─── 12. ssjs-require-hasownproperty ──────────────────────────────────────────

ssjsTester.run('ssjs-require-hasownproperty', ssjsRequireHasownproperty, {
    valid: [
        {
            code: 'for (var k in obj) { if (obj.hasOwnProperty(k)) { doSomething(k); } }',
        },
        {
            code: 'for (var k in obj) { if (!obj.hasOwnProperty(k)) continue; doSomething(k); }',
        },
        {
            code: 'for (var k in obj) {}',
        },
    ],
    invalid: [
        {
            // BlockStatement body — wrap inner content with guard
            code: 'for (var k in obj) { doSomething(k); }',
            errors: [
                {
                    messageId: 'missingGuard',
                    suggestions: [
                        {
                            messageId: 'suggestAddGuard',
                            data: { obj: 'obj', key: 'k' },
                            output: 'for (var k in obj) { if (obj.hasOwnProperty(k)) { doSomething(k); } }',
                        },
                    ],
                },
            ],
        },
        {
            code: "for (var k in obj) { if (k !== '_type') { use(k); } }",
            errors: [
                {
                    messageId: 'missingGuard',
                    suggestions: [
                        {
                            messageId: 'suggestAddGuard',
                            data: { obj: 'obj', key: 'k' },
                            output: "for (var k in obj) { if (obj.hasOwnProperty(k)) { if (k !== '_type') { use(k); } } }",
                        },
                    ],
                },
            ],
        },
        {
            // Single-statement body — replaced with a block containing the guard
            code: 'for (var k in obj) doSomething(k);',
            errors: [
                {
                    messageId: 'missingGuard',
                    suggestions: [
                        {
                            messageId: 'suggestAddGuard',
                            data: { obj: 'obj', key: 'k' },
                            output: 'for (var k in obj) { if (obj.hasOwnProperty(k)) { doSomething(k); } }',
                        },
                    ],
                },
            ],
        },
    ],
});

// ─── 13. ssjs-require-platform-load-order ─────────────────────────────────────

ssjsTester.run('ssjs-require-platform-load-order', ssjsRequirePlatformLoadOrder, {
    valid: [
        {
            code: 'Platform.Load("core", "1");\nvar de = DataExtension.Init("MyDE");',
        },
        {
            code: 'Platform.Load("core", "1");\nSubscriber.Init("sub");',
        },
        {
            code: 'var x = 1;',
        },
        {
            code: 'var de = DataExtension.Init("MyDE");',
        },
    ],
    invalid: [
        {
            code: 'var de = DataExtension.Init("MyDE");\nPlatform.Load("core", "1");',
            errors: [{ messageId: 'loadAfterUse' }],
        },
        {
            code: 'Subscriber.Init("sub");\nEmail.Init("e");\nPlatform.Load("core", "1");',
            errors: [{ messageId: 'loadAfterUse' }, { messageId: 'loadAfterUse' }],
        },
        {
            code: 'DataExtension.Rows.Init("DE");\nPlatform.Load("core","1");',
            errors: [{ messageId: 'loadAfterUse' }],
        },
    ],
});

// ─── 14. ssjs-no-hardcoded-credentials ────────────────────────────────────────

ssjsTester.run('ssjs-no-hardcoded-credentials', ssjsNoHardcodedCredentials, {
    valid: [
        {
            code: 'Platform.Function.EncryptSymmetric(plainText, algo, keyVar, keyDE, ivVar, ivDE, saltVar, saltDE);',
        },
        {
            code: 'Platform.Function.DecryptSymmetric(encrypted, algo, keyVar, keyDE, ivVar, ivDE, saltVar, saltDE);',
        },
        {
            code: 'Platform.Function.Lookup("DE", "Field", "Key", "Val");',
        },
        {
            code: 'Platform.Function.EncryptSymmetric("plain", algo, keyVar, keyDE, ivVar, ivDE);',
        },
    ],
    invalid: [
        {
            code: 'Platform.Function.EncryptSymmetric("plain", "hardkey", keyVar, keyDE, ivVar, ivDE, saltVar, saltDE);',
            errors: [{ messageId: 'hardcodedCredential' }],
        },
        {
            code: 'Platform.Function.DecryptSymmetric(encrypted, "hardkey", keyVar, "hardiv", ivVar, ivDE, saltVar, saltDE);',
            errors: [{ messageId: 'hardcodedCredential' }, { messageId: 'hardcodedCredential' }],
        },
        {
            code: 'Platform.Function.EncryptSymmetric("plain", "k", keyVar, "i", ivVar, "s", saltVar, "x");',
            errors: [
                { messageId: 'hardcodedCredential' },
                { messageId: 'hardcodedCredential' },
                { messageId: 'hardcodedCredential' },
                { messageId: 'hardcodedCredential' },
            ],
        },
    ],
});

// ─── 15. ssjs-prefer-platform-load-version ────────────────────────────────────

ssjsTester.run('ssjs-prefer-platform-load-version', ssjsPreferPlatformLoadVersion, {
    valid: [
        {
            code: 'Platform.Load("core", "1.1.5");',
        },
        {
            code: 'Platform.Load("Core", "1.1.5");',
        },
        {
            code: 'var x = 1;',
        },
        {
            code: 'Platform.Load("core", "1.1.5"); var de = DataExtension.Init("MyDE");',
        },
        {
            code: 'Platform.Load("core", "2.0.0");',
            options: [{ version: '2.0.0' }],
        },
    ],
    invalid: [
        {
            code: 'Platform.Load("core", "1");',
            errors: [{ messageId: 'outdatedVersion' }],
            output: 'Platform.Load("core", "1.1.5");',
        },
        {
            code: 'Platform.Load("Core", "1.1.1");',
            errors: [{ messageId: 'outdatedVersion' }],
            output: 'Platform.Load("Core", "1.1.5");',
        },
        {
            code: 'Platform.Load("core", "1.1");',
            errors: [{ messageId: 'outdatedVersion' }],
            output: 'Platform.Load("core", "1.1.5");',
        },
        {
            code: 'Platform.Load("core", "1");',
            options: [{ version: '2.0.0' }],
            errors: [{ messageId: 'outdatedVersion' }],
            output: 'Platform.Load("core", "2.0.0");',
        },
        {
            // Missing version argument — fix inserts the default version
            code: 'Platform.Load("core");',
            errors: [{ messageId: 'outdatedVersion', data: { actual: '(none)', expected: '1.1.5' } }],
            output: 'Platform.Load("core", "1.1.5");',
        },
    ],
});

// ─── 16. ssjs-no-unavailable-method ──────────────────────────────────────────

ssjsTester.run('ssjs-no-unavailable-method', ssjsNoUnavailableMethod, {
    valid: [
        // Native methods that work correctly — never flagged
        { code: 'var a = [1,2,3]; a.push(4);' },
        { code: 'var a = [1,2,3]; a.pop();' },
        { code: 'var a = [1,2,3]; a.reverse();' },
        { code: 'var a = [1,2,3]; a.join(",");' },
        { code: 'var a = [1,2,3]; a.slice(0,2);' },

        // Polyfill already defined inline — suppressed
        {
            code: 'Array.prototype.map = function (cb) { var r=[]; for(var i=0;i<this.length;i++){r.push(cb(this[i]));} return r; };\nvar a = [1,2,3];\na.map(function(x){return x;});',
        },
        { code: 'Array.isArray = function(v){ return true; }; Array.isArray([]);' },

        // SFMC objects — must not be flagged even when method name matches
        { code: 'Platform.Function.Lookup("DE","F","K","V");' },
        { code: 'HTTP.Get("https://example.com");' },

        // String .indexOf() on an unknown receiver — ambiguous, should not be flagged
        { code: 'var s = "hello"; s.indexOf("e");' },
        { code: '"hello".indexOf("h");' },
        { code: 'var x = someString.indexOf("z");' },

        // ignore option
        {
            code: 'var a = [1,2,3]; a.map(function(x){return x;});',
            options: [{ ignore: ['map'] }],
        },
        {
            code: 'Array.isArray([]);',
            options: [{ ignore: ['isArray'] }],
        },
    ],
    invalid: [
        // ── Prototype methods (unavailable) ──────────────────────────────────
        {
            code: 'var a = [1,2,3]; a.map(function(x){ return x * 2; });',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'map' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.filter(function(x){ return x > 1; });',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'filter' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.find(function(x){ return x === 2; });',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'find' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.findIndex(function(x){ return x === 2; });',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'findIndex' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.forEach(function(x){ Write(x); });',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'forEach' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.reduce(function(acc,x){ return acc + x; }, 0);',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'reduce' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.reduceRight(function(acc,x){ return acc + x; }, 0);',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'reduceRight' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.fill(0);',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'fill' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.entries();',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'entries' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.copyWithin(1, 0);',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'copyWithin' }, suggestions: 1 }],
        },
        {
            code: 'var a = [1,2,3]; a.includes(2);',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'includes' }, suggestions: 1 }],
        },

        // ── indexOf / lastIndexOf on literal arrays (unambiguous) ─────────────
        {
            code: '[1,2,3].indexOf(2);',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array.prototype', method: 'indexOf' }, suggestions: 1 }],
        },
        {
            code: '[1,2,3].lastIndexOf(2);',
            errors: [{ messageId: 'broken', data: { owner: 'Array.prototype', method: 'lastIndexOf' }, suggestions: 1 }],
        },

        // ── Broken prototype methods ──────────────────────────────────────────
        {
            code: 'var a = [1,2,3]; a.splice(1, 1);',
            errors: [{ messageId: 'broken', data: { owner: 'Array.prototype', method: 'splice' }, suggestions: 1 }],
        },

        // ── Static methods ────────────────────────────────────────────────────
        {
            code: 'Array.of(1, 2, 3);',
            errors: [{ messageId: 'unavailable', data: { owner: 'Array', method: 'of' }, suggestions: 1 }],
        },

        // ── Suggestion inserts polyfill at end of file ────────────────────────
        {
            code: 'var a = [1,2,3]; a.some(function(x){ return x > 2; });',
            errors: [
                {
                    messageId: 'unavailable',
                    suggestions: [
                        {
                            messageId: 'addPolyfill',
                            data: { owner: 'Array.prototype', method: 'some' },
                            output:
                                'var a = [1,2,3]; a.some(function(x){ return x > 2; });\n\n' +
                                "Array.prototype.some = function (predicate) {\n" +
                                "    if (typeof predicate !== 'function') { return false; }\n" +
                                "    for (var i = 0; i < this.length; i++) {\n" +
                                "        if (predicate(this[i], i, this)) { return true; }\n" +
                                "    }\n" +
                                "    return false;\n" +
                                '};',
                        },
                    ],
                },
            ],
        },
        {
            code: 'Array.isArray([]);',
            errors: [
                {
                    messageId: 'unavailable',
                    suggestions: [
                        {
                            messageId: 'addPolyfill',
                            data: { owner: 'Array', method: 'isArray' },
                            output:
                                'Array.isArray([]);\n\n' +
                                'Array.isArray = function (value) {\n' +
                                "    return Object.prototype.toString.call(value) === '[object Array]';\n" +
                                '};',
                        },
                    ],
                },
            ],
        },
    ],
});

// ─── 17. ssjs-no-unsupported-syntax: DirectObjectReturn + NewExpression ──────

ssjsTester.run('ssjs-no-unsupported-syntax (DirectObjectReturn)', ssjsNoUnsupportedSyntax, {
    valid: [
        { code: 'function foo() { var r = { a: 1 }; return r; }' },
        { code: 'function foo() { return 42; }' },
        { code: 'function foo() { return "hello"; }' },
        { code: 'function foo() { return null; }' },
    ],
    invalid: [
        {
            code: 'function foo() { return { a: 1 }; }',
            errors: [
                {
                    messageId: 'unsupported',
                    suggestions: [
                        {
                            messageId: 'suggestVarReturn',
                            output: 'function foo() { var _result = { a: 1 };\n                 return _result; }',
                        },
                    ],
                },
            ],
        },
    ],
});

ssjsTester.run('ssjs-no-unsupported-syntax (NewExpression)', ssjsNoUnsupportedSyntax, {
    valid: [
        { code: 'var d = new Date();' },
        { code: 'var r = new RegExp("abc");' },
        { code: 'var e = new Error("fail");' },
        { code: 'var proxy = new WSProxy();' },
        { code: 'var instance = MyClass();' },
    ],
    invalid: [
        {
            code: 'var instance = new MyClass();',
            errors: [{ messageId: 'unsupported' }],
        },
        {
            code: 'var x = new Foo(1, 2);',
            errors: [{ messageId: 'unsupported' }],
        },
    ],
});

// ─── 18. ssjs-no-unavailable-method: String polyfills ────────────────────────

ssjsTester.run('ssjs-no-unavailable-method (String polyfills)', ssjsNoUnavailableMethod, {
    valid: [
        { code: 'String.prototype.trim = function() { return "x"; }; var s = "hi"; s.trim();' },
        { code: 'String.prototype.endsWith = function() { return true; }; "hi".endsWith("i");' },
    ],
    invalid: [
        {
            code: 'var s = "hello "; s.trim();',
            errors: [{ messageId: 'unavailable', data: { owner: 'String.prototype', method: 'trim' }, suggestions: 1 }],
        },
        {
            code: '"hello".endsWith("lo");',
            errors: [{ messageId: 'unavailable', data: { owner: 'String.prototype', method: 'endsWith' }, suggestions: 1 }],
        },
    ],
});

// ─── 19. ssjs-prefer-parsejson-safe-arg ──────────────────────────────────────

ssjsTester.run('ssjs-prefer-parsejson-safe-arg', ssjsPreferParsejsonSafeArg, {
    valid: [
        { code: "Platform.Function.ParseJSON(someVar + '');" },
        { code: "Platform.Function.ParseJSON('' + someVar);" },
        { code: 'Platform.Function.ParseJSON("{\\"a\\":1}");' },
        { code: 'var x = 1;' },
    ],
    invalid: [
        {
            code: 'Platform.Function.ParseJSON(someVar);',
            errors: [{ messageId: 'unsafeArg' }],
            output: "Platform.Function.ParseJSON(someVar + '');",
        },
        {
            code: 'Platform.Function.ParseJSON(getData());',
            errors: [{ messageId: 'unsafeArg' }],
            output: "Platform.Function.ParseJSON(getData() + '');",
        },
    ],
});

// ─── 20. ssjs-no-switch-default ──────────────────────────────────────────────

ssjsTester.run('ssjs-no-switch-default', ssjsNoSwitchDefault, {
    valid: [
        { code: 'switch(x) { case 1: break; case 2: break; }' },
        { code: 'var x = 1;' },
    ],
    invalid: [
        {
            code: 'switch(x) { case 1: break; default: break; }',
            errors: [{ messageId: 'noDefault' }],
        },
    ],
});

// ─── 21. ssjs-no-treatascontent-injection ────────────────────────────────────

ssjsTester.run('ssjs-no-treatascontent-injection', ssjsNoTreatAsContentInjection, {
    valid: [
        { code: 'Platform.Function.TreatAsContent("%%[ Set @x = Trim(@input) ]%%");' },
        { code: 'TreatAsContent("%%[ Set @x = 1 ]%%");' },
        { code: 'var x = "a" + "b";' },
    ],
    invalid: [
        {
            code: 'Platform.Function.TreatAsContent("%%[ Set @x = Trim(\\"" + myVar + "\\") ]%%");',
            errors: [{ messageId: 'injection' }],
        },
        {
            code: 'TreatAsContent("%%[ " + code + " ]%%");',
            errors: [{ messageId: 'injection' }],
        },
    ],
});

console.log('All SSJS rule tests passed.');

// ── 16. amp-no-html-comment ───────────────────────────────────────────────────

ampTester.run('amp-no-html-comment', ampNoHtmlComment, {
    valid: [
        { code: '%%[ /* valid AMPscript comment */ set @x = 1 ]%%' },
        { code: '%%[ set @x = "<!-- not inside ampscript context" ]%%' },
        { code: '<script runat="server" language="ampscript">/* ok */\nset @x = 1\n</script>' },
    ],
    invalid: [
        {
            code: '%%[\n  <!--/* OPCO specific Language */-->\n  set @x = 1\n]%%',
            errors: [{ messageId: 'htmlWrappedComment' }],
            output: '%%[\n  /* OPCO specific Language */\n  set @x = 1\n]%%',
        },
        {
            code: '%%[\n  <!-- some comment -->\n  set @x = 1\n]%%',
            errors: [{ messageId: 'htmlComment' }],
            output: '%%[\n  /* some comment */\n  set @x = 1\n]%%',
        },
        {
            code: '<script runat="server" language="ampscript">\n  <!--/* Script */-->\n  set @x = 1\n</script>',
            errors: [{ messageId: 'htmlWrappedComment' }],
            output: '<script runat="server" language="ampscript">\n  /* Script */\n  set @x = 1\n</script>',
        },
    ],
});

// ── 17. amp-no-js-line-comment ────────────────────────────────────────────────

ampTester.run('amp-no-js-line-comment', ampNoJsLineComment, {
    valid: [
        { code: '%%[ /* valid block comment */ set @x = 1 ]%%' },
        { code: '%%[ set @url = "https://example.com" ]%%' },
        { code: '<script runat="server" language="ampscript">/* ok */\nset @x = 1\n</script>' },
    ],
    invalid: [
        {
            code: '%%[\n  // Language\n  set @x = 1\n]%%',
            errors: [{ messageId: 'jsLineComment' }],
            output: '%%[\n  /* Language */\n  set @x = 1\n]%%',
        },
        {
            code: '<script runat="server" language="ampscript">\n  // some comment\n  set @x = 1\n</script>',
            errors: [{ messageId: 'jsLineComment' }],
            output: '<script runat="server" language="ampscript">\n  /* some comment */\n  set @x = 1\n</script>',
        },
        {
            code: '%%[\n  // \n  set @x = 1\n]%%',
            errors: [{ messageId: 'jsLineComment' }],
            output: '%%[\n  /**/\n  set @x = 1\n]%%',
        },
    ],
});

// ── 18. amp-no-nested-script-tag ─────────────────────────────────────────────

ampTester.run('amp-no-nested-script-tag', ampNoNestedScriptTag, {
    valid: [
        {
            code: '<script runat="server" language="ampscript">\nset @x = 1\n</script>',
        },
        { code: '%%[ set @x = 1 ]%%' },
    ],
    invalid: [
        {
            code: '<script runat="server" language="ampscript">\nset @x = 1\n<script runat="server" language="ampscript">\nset @y = 2\n</script>\n</script>',
            errors: [{ messageId: 'nestedScriptTag' }],
            output: '<script runat="server" language="ampscript">\nset @x = 1\n</script>\n<script runat="server" language="ampscript">\nset @y = 2\n</script>\n</script>',
        },
    ],
});

// ── 19. amp-no-nested-ampscript-delimiter ────────────────────────────────────

ampTester.run('amp-no-nested-ampscript-delimiter', ampNoNestedAmpscriptDelimiter, {
    valid: [
        { code: '%%[ set @x = 1 ]%%' },
        { code: '%%= V(@name) =%%' },
        { code: '<script runat="server" language="ampscript">\nset @x = 1\n</script>' },
    ],
    invalid: [
        {
            code: '%%[\n  %%[ set @inner = 1 ]%%\n]%%',
            errors: [{ messageId: 'nestedDelimiter', data: { delimiter: '%%[' } }],
            output: '%%[\n   set @inner = 1 \n]%%',
        },
        {
            code: '<script runat="server" language="ampscript">\n%%[ set @x = 1 ]%%\n</script>',
            errors: [{ messageId: 'nestedDelimiterInScript', data: { delimiter: '%%[' } }],
            output: '<script runat="server" language="ampscript">\n set @x = 1 \n</script>',
        },
    ],
});

console.log('All new AMPscript syntax rule tests passed.');

// ═══════════════════════════════════════════════════════════════════════════════
// Combined Processor Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

describe('combined SFMC processor', () => {
    it('extracts %%[ ]%% blocks as virtual .amp files', () => {
        const html = '<p>Hello</p>%%[set @x = 1]%%<p>World</p>';
        const result = preprocess(html, 'test.html');
        const ampBlocks = result.filter((b) => b.filename && b.filename.endsWith('.amp'));
        assert.ok(ampBlocks.length > 0, 'Should extract at least one .amp block');
        assert.ok(ampBlocks[0].text.includes('%%[set @x = 1]%%'));
    });

    it('extracts %%= =%% inline expressions as virtual .amp files', () => {
        const html = '<p>Hello %%= V(@name) =%%!</p>';
        const result = preprocess(html, 'test.html');
        const ampBlocks = result.filter((b) => b.filename && b.filename.endsWith('.amp'));
        assert.ok(ampBlocks.length > 0, 'Should extract inline expression');
        assert.ok(ampBlocks[0].text.includes('V(@name)'));
    });

    it('extracts <script runat=server language=ampscript> as virtual .amp files', () => {
        const html = '<script runat="server" language="ampscript">set @x = 1</script>';
        const result = preprocess(html, 'test.html');
        const ampBlocks = result.filter((b) => b.filename && b.filename.endsWith('.amp'));
        assert.ok(ampBlocks.length > 0, 'Should extract ampscript script tag');
    });

    it('extracts <script runat=server> (SSJS) as virtual .js files', () => {
        const html = '<script runat="server">var x = 1;</script>';
        const result = preprocess(html, 'test.html');
        const jsBlocks = result.filter((b) => b.filename && b.filename.endsWith('.js'));
        assert.ok(jsBlocks.length > 0, 'Should extract SSJS block');
        assert.ok(jsBlocks[0].text.includes('var x = 1;'));
    });

    it('extracts both AMPscript and SSJS from a mixed HTML file', () => {
        const html = [
            '<html><body>',
            '%%[set @name = "World"]%%',
            '<p>Hello %%= V(@name) =%%!</p>',
            '<script runat="server">',
            'Platform.Load("core", "1");',
            'var de = DataExtension.Init("MyDE");',
            '</script>',
            '</body></html>',
        ].join('\n');
        const result = preprocess(html, 'test.html');
        const ampBlocks = result.filter((b) => b.filename && b.filename.endsWith('.amp'));
        const jsBlocks = result.filter((b) => b.filename && b.filename.endsWith('.js'));
        assert.ok(ampBlocks.length >= 2, `Expected >= 2 .amp blocks, got ${ampBlocks.length}`);
        assert.ok(jsBlocks.length > 0, `Expected >= 1 .js blocks, got ${jsBlocks.length}`);
    });

    it('returns original text when no SFMC regions found', () => {
        const html = '<p>Just HTML</p>';
        const result = preprocess(html, 'test.html');
        assert.equal(result.length, 1);
        assert.equal(result[0], html);
    });

    it('does not extract <script runat=server language=ampscript> as SSJS', () => {
        const html = '<script runat="server" language="ampscript">set @x = 1</script>';
        const result = preprocess(html, 'test.html');
        const jsBlocks = result.filter((b) => b.filename && b.filename.endsWith('.js'));
        assert.equal(jsBlocks.length, 0, 'AMPscript script tags should not produce .js blocks');
    });

    it('postprocess flattens messages', () => {
        const messages = [['msg1', 'msg2'], ['msg3']];
        const result = postprocess(messages);
        assert.deepEqual(result, ['msg1', 'msg2', 'msg3']);
    });
});

console.log('All combined processor tests passed.');
