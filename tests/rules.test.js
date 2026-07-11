import { RuleTester, ESLint } from 'eslint';
import * as parser from '../src/ampscript-parser.js';
import sfmcPlugin from '../src/index.js';

// ── AMPscript rule imports ────────────────────────────────────────────────────

import ampNoUnknownFunction from '../src/rules/amp/no-unknown-function.js';
import ampNoMcnUnsupported from '../src/rules/amp/no-mcn-unsupported.js';
import ampNoHtmlComment from '../src/rules/amp/no-html-comment.js';
import ampNoJsLineComment from '../src/rules/amp/no-js-line-comment.js';
import ampNoNestedScriptTag from '../src/rules/amp/no-nested-script-tag.js';
import ampNoNestedAmpscriptDelimiter from '../src/rules/amp/no-nested-ampscript-delimiter.js';
import ampNoVariableRedeclaration from '../src/rules/amp/no-variable-redeclaration.js';
import ampSetRequiresTarget from '../src/rules/amp/set-requires-target.js';
import ampNoEmptyBlock from '../src/rules/amp/no-empty-block.js';
import ampNoSmartQuotes from '../src/rules/amp/no-smart-quotes.js';
import ampPreferAttributeValue from '../src/rules/amp/prefer-attribute-value.js';
import ampNoLoopCounterAssign from '../src/rules/amp/no-loop-counter-assign.js';
import ampNoInlineStatement from '../src/rules/amp/no-inline-statement.js';
import ampRequireVariableDeclaration from '../src/rules/amp/require-variable-declaration.js';
import ampFunctionArity from '../src/rules/amp/function-arity.js';
import ampArgumentTypes from '../src/rules/amp/argument-types.js';
import ampNoEmailExcludedFunction from '../src/rules/amp/no-email-excluded-function.js';
import ampNoDeprecatedFunction from '../src/rules/amp/no-deprecated-function.js';
import ampNamingConvention from '../src/rules/amp/naming-convention.js';
import ampNoEmptyThen from '../src/rules/amp/no-empty-then.js';
import ampRequireRowcountCheck from '../src/rules/amp/require-rowcount-check.js';

// ── SSJS rule imports ─────────────────────────────────────────────────────────

import ssjsRequirePlatformLoad from '../src/rules/ssjs/require-platform-load.js';
import ssjsNoUnsupportedSyntax from '../src/rules/ssjs/no-unsupported-syntax.js';
import ssjsNoUnknownFunction from '../src/rules/ssjs/no-unknown-function.js';
import ssjsNoMcnUnsupported from '../src/rules/ssjs/no-mcn-unsupported.js';
import ssjsNoDeprecatedFunction from '../src/rules/ssjs/no-deprecated-function.js';
import ssjsNoPropertyCall from '../src/rules/ssjs/no-property-call.js';
import ssjsPlatformFunctionArity from '../src/rules/ssjs/platform-function-arity.js';
import ssjsCacheLoopLength from '../src/rules/ssjs/cache-loop-length.js';
import ssjsRequireHasownproperty from '../src/rules/ssjs/require-hasownproperty.js';
import ssjsRequirePlatformLoadOrder from '../src/rules/ssjs/require-platform-load-order.js';
import ssjsNoHardcodedCredentials from '../src/rules/ssjs/no-hardcoded-credentials.js';
import ssjsPreferPlatformLoadVersion from '../src/rules/ssjs/prefer-platform-load-version.js';
import ssjsNoUnavailableMethod from '../src/rules/ssjs/no-unavailable-method.js';
import ssjsPreferParsejsonSafeArgument from '../src/rules/ssjs/prefer-parsejson-safe-argument.js';
import ssjsNoSwitchDefault from '../src/rules/ssjs/no-switch-default.js';
import ssjsNoTreatAsContentInjection from '../src/rules/ssjs/no-treatascontent-injection.js';
import ssjsArgumentTypes from '../src/rules/ssjs/ssjs-argument-types.js';
import ssjsCoreMethodArity from '../src/rules/ssjs/ssjs-core-method-arity.js';

// ── Handlebars (MCN) rule imports ─────────────────────────────────────────────

import hbsNoUnknownHelper from '../src/rules/hbs/no-unknown-helper.js';
import hbsNoMcnUnsupported from '../src/rules/hbs/no-mcn-unsupported.js';
import hbsNoUnknownBinding from '../src/rules/hbs/no-unknown-binding.js';
import hbsHelperArity from '../src/rules/hbs/helper-arity.js';
import hbsNoUnsupportedConstruct from '../src/rules/hbs/no-unsupported-construct.js';

// ── Parser imports ────────────────────────────────────────────────────────────

import * as handlebarsParser from '../src/handlebars-parser.js';

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

// ── 1b. amp-no-mcn-unsupported ────────────────────────────────────────────────

ampTester.run('amp-no-mcn-unsupported', ampNoMcnUnsupported, {
    valid: [
        // No apiVersion → MCN-supported functions pass.
        { code: '%%[set @x = Lookup("DE", "F", "K", @v)]%%' },
        { code: '%%= Concat("hello", " ", "world") =%%' },
        { code: '%%[set @d = Now()]%%' },
        // Unknown functions are handled by amp-no-unknown-function, not here.
        { code: '%%[set @x = FooBar(@v)]%%' },
        // apiVersion 67 → a function introduced in 67 passes (mcnSince <= target).
        { code: '%%[set @d = Now()]%%', options: [{ apiVersion: 67 }] },
    ],
    invalid: [
        // Never supported in MCN → always flagged (no apiVersion).
        {
            code: '%%[InsertDE("MyDE", "Col", "Val")]%%',
            errors: [{ messageId: 'notSupportedInMcn', data: { name: 'InsertDE' } }],
        },
        // MCN-supported AMPscript function with no Handlebars equivalent.
        {
            code: '%%= ContentBlockByID(123) =%%',
            errors: [{ messageId: 'noHandlebarsEquivalent', data: { name: 'ContentBlockByID' } }],
        },
        {
            code: '%%= ContentBlockByName("Public/MyBlock") =%%',
            errors: [{ messageId: 'noHandlebarsEquivalent', data: { name: 'ContentBlockByName' } }],
        },
        // apiVersion 65 → a function introduced in 67 is too new for the target.
        {
            code: '%%[set @d = Now()]%%',
            options: [{ apiVersion: 65 }],
            errors: [
                {
                    messageId: 'tooNewForTarget',
                    data: { name: 'Now', since: '67', target: '65' },
                },
            ],
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
            code: '%%[set @x = "he\u{2019}s here"]%%',
            output: '%%[set @x = "he\'s here"]%%',
            errors: [
                {
                    messageId: 'smartQuote',
                    data: { kind: 'right single curly quote \u{2019}' },
                },
            ],
        },
        {
            // double curly quotes — each smart quote is flagged and swapped for a
            // straight ASCII double quote (per-character scan, matches the LSP).
            code: '%%[set @x = "\u{201C}hello\u{201D}"]%%',
            output: '%%[set @x = ""hello""]%%',
            errors: [
                {
                    messageId: 'smartQuote',
                    data: { kind: 'left double curly quote \u{201C}' },
                },
                {
                    messageId: 'smartQuote',
                    data: { kind: 'right double curly quote \u{201D}' },
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
            output: '%%[var @x\nset @x = 1]%%',
            errors: [{ messageId: 'undeclared', data: { name: '@x' } }],
        },
        {
            code: '%%[var @a\nset @b = 2]%%',
            output: '%%[var @a\nvar @b\nset @b = 2]%%',
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
        // single repeating group (Concat: groupSize 1) — any count >= 2 is complete
        { code: '%%= Concat("a", "b") =%%' },
        // single repeating group (ReplaceList: 1 fixed + N searchStrings, groupSize 1)
        { code: '%%= ReplaceList("text", "a", "b", "c") =%%' },
        // two repeating groups (UpdateData): columnValuePairs=1 -> 1 search pair + 1 update pair
        { code: '%%[UpdateData("DE", 1, "Key", @k, "Col", @v)]%%' },
        // two repeating groups: columnValuePairs=2 -> 2 search pairs + 1 update pair
        { code: '%%[UpdateData("DE", 2, "K1", @a, "K2", @b, "Col", @v)]%%' },
    ],
    invalid: [
        {
            code: '%%= V() =%%',
            errors: [
                {
                    messageId: 'tooFewArgs',
                    data: { name: 'v', min: '1', actual: '0' },
                },
            ],
        },
        {
            code: '%%= V(@x, @y) =%%',
            errors: [
                {
                    messageId: 'tooManyArgs',
                    data: { name: 'v', max: '1', actual: '2' },
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
        {
            // UpdateData: columnValuePairs=1 (1 search pair), then 3 update args —
            // the second repeating group (size 2) is incomplete (odd count).
            code: '%%[UpdateData("DE", 1, "Key", @k, "Col", @v, "Orphan")]%%',
            errors: [
                {
                    messageId: 'incompleteGroup',
                    data: { name: 'UpdateData', size: '2' },
                },
            ],
        },
    ],
});

// ── 10b. amp-arg-types ────────────────────────────────────────────────────────

ampTester.run('amp-arg-types', ampArgumentTypes, {
    valid: [
        // valid enum literal (exact case)
        { code: "%%= DatePart('2026-01-15', 'Y') =%%" },
        // valid enum literal (different case — matching is case-insensitive)
        { code: "%%= DatePart('2026-01-15', 'year') =%%" },
        { code: "%%= DatePart('2026-01-15', 'MONTHNAME') =%%" },
        // variable argument — not statically checkable, skipped
        { code: '%%= DatePart(@d, @part) =%%' },
        // function with no enum params — never flagged
        { code: '%%= Add(1, 2) =%%' },
    ],
    invalid: [
        {
            code: "%%= DatePart('2026-01-15', 'decade') =%%",
            errors: [
                {
                    messageId: 'invalidEnumValue',
                    data: {
                        name: 'DatePart',
                        param: 'datePart',
                        allowed: 'year, Y, month, M, monthName, day, D, hour, H, minute, MI',
                        actual: 'decade',
                    },
                },
            ],
        },
        {
            // numeric literal in an enum slot is also invalid
            code: "%%= DatePart('2026-01-15', 5) =%%",
            errors: [
                {
                    messageId: 'invalidEnumValue',
                    data: {
                        name: 'DatePart',
                        param: 'datePart',
                        allowed: 'year, Y, month, M, monthName, day, D, hour, H, minute, MI',
                        actual: '5',
                    },
                },
            ],
        },
        {
            // boolean literal in an enum slot is also invalid
            code: "%%= DatePart('2026-01-15', true) =%%",
            errors: [
                {
                    messageId: 'invalidEnumValue',
                    data: {
                        name: 'DatePart',
                        param: 'datePart',
                        allowed: 'year, Y, month, M, monthName, day, D, hour, H, minute, MI',
                        actual: 'true',
                    },
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
        // InsertDE is a valid email-context function, not deprecated
        { code: '%%[InsertDE("DE", "Col", @val)]%%' },
        // Modern Content Builder replacements are not deprecated
        { code: '%%[ContentBlockByID(123)]%%' },
        { code: '%%[ContentBlockByName("Public/MyBlock")]%%' },
    ],
    invalid: [
        {
            // 1:1 replacement — auto-fix renames the function in-place
            code: '%%[ContentArea(123)]%%',
            output: '%%[ContentBlockByID(123)]%%',
            errors: [
                {
                    messageId: 'deprecated',
                    data: {
                        name: 'ContentArea',
                        replacement: 'ContentBlockByID',
                        reason: 'ContentArea references classic content areas, which are no longer supported. Use Content Builder content blocks instead.',
                    },
                },
            ],
        },
        {
            code: '%%[ContentAreaByName("Public/MyBlock")]%%',
            output: '%%[ContentBlockByName("Public/MyBlock")]%%',
            errors: [
                {
                    messageId: 'deprecated',
                    data: {
                        name: 'ContentAreaByName',
                        replacement: 'ContentBlockByName',
                        reason: 'ContentAreaByName references classic content areas, which are no longer supported. Use Content Builder content blocks instead.',
                    },
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
            code: 'var x = a ?? b;',
            output: 'var x = a || b;',
            errors: [{ messageId: 'unsupported' }],
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

// ─── 3. ssjs-no-unknown-function ──────────────────────────────────────────────

ssjsTester.run('ssjs-no-unknown-function', ssjsNoUnknownFunction, {
    valid: [
        // Platform.Function — known method
        { code: 'Platform.Function.Lookup("DE", "Field", "Key", "Val");' },
        { code: 'Platform.Function.LookupRows("DE", "K", "V");' },
        // Platform.Variable — known methods
        { code: 'Platform.Variable.GetValue("myVar");' },
        { code: 'Platform.Variable.SetValue("myVar", "x");' },
        // Platform.Request — known method
        { code: 'Platform.Request.GetQueryStringParameter("id");' },
        // Platform.Response — known method
        { code: 'Platform.Response.Write("<p>Hello</p>");' },
        // HTTP — known methods
        { code: 'HTTP.Get("https://example.com");' },
        { code: 'HTTP.Post("https://example.com", "application/json", "{}");' },
        // Core Library — valid instance method
        { code: 'var de = DataExtension.Init("MyDE"); de.Retrieve();' },
        { code: 'var sub = Subscriber.Init("s"); sub.Add();' },
        // Core Library — untracked variable (no false positive)
        { code: 'var x = somethingElse(); x.Anything();' },
        // WSProxy — valid method
        {
            code: 'var api = new Script.Util.WSProxy(); api.retrieve("DataExtension", ["Name"], {});',
        },
        { code: 'var api = new Script.Util.WSProxy(); api.setClientId(12345);' },
        // WSProxy — untracked variable (no false positive)
        { code: 'someObj.unknownMethod();' },
    ],
    invalid: [
        // Platform.Function — unknown method
        {
            code: 'Platform.Function.FetchRows("DE");',
            errors: [{ messageId: 'unknownPlatformMethod' }],
        },
        {
            code: 'Platform.Function.DoSomethingFake();',
            errors: [{ messageId: 'unknownPlatformMethod' }],
        },
        // Platform.Variable — unknown method
        {
            code: 'Platform.Variable.Delete("myVar");',
            errors: [{ messageId: 'unknownPlatformMethod' }],
        },
        // HTTP — unknown method
        {
            code: 'HTTP.Put("https://example.com");',
            errors: [{ messageId: 'unknownHttpMethod' }],
        },
        {
            code: 'HTTP.Patch("https://example.com");',
            errors: [{ messageId: 'unknownHttpMethod' }],
        },
        // Core Library — unknown instance method
        {
            code: 'var de = DataExtension.Init("MyDE"); de.Execute();',
            errors: [{ messageId: 'unknownCoreMethod' }],
        },
        {
            code: 'var sub = Subscriber.Init("s"); sub.Send();',
            errors: [{ messageId: 'unknownCoreMethod' }],
        },
        // WSProxy — unknown method
        {
            code: 'var api = new Script.Util.WSProxy(); api.query();',
            errors: [{ messageId: 'unknownWsproxyMethod' }],
        },
        {
            code: 'var proxy = new Script.Util.WSProxy(); proxy.fetch();',
            errors: [{ messageId: 'unknownWsproxyMethod' }],
        },
    ],
});

// ─── 3b. ssjs-no-mcn-unsupported ──────────────────────────────────────────────

ssjsTester.run('ssjs-no-mcn-unsupported', ssjsNoMcnUnsupported, {
    valid: [
        // Bare JS calls (not SFMC API calls) are not flagged.
        { code: 'someObj.unknownMethod();' },
        { code: 'var x = somethingElse(); x.Anything();' },
        // apiVersion is accepted for parity but has no effect (SSJS never supported).
        { code: 'var y = plainHelper();', options: [{ apiVersion: 67 }] },
    ],
    invalid: [
        // Platform namespace call flagged.
        {
            code: 'Platform.Function.Lookup("DE", "F", "K", "V");',
            errors: [{ messageId: 'ssjsNotSupportedInMcn' }],
        },
        // Platform.Load flagged (previously missed by no-unknown-function).
        {
            code: 'Platform.Load("Core", "1.1.1");',
            errors: [{ messageId: 'ssjsNotSupportedInMcn' }],
        },
        // HTTP call flagged.
        {
            code: 'HTTP.Get("https://example.com");',
            errors: [{ messageId: 'ssjsNotSupportedInMcn' }],
        },
        // Core Library instance call flagged.
        {
            code: 'var de = DataExtension.Init("MyDE"); de.Rows.Retrieve();',
            errors: [{ messageId: 'ssjsNotSupportedInMcn' }],
        },
        // WSProxy construction flagged (previously missed by no-unknown-function).
        {
            code: 'var api = new Script.Util.WSProxy();',
            errors: [{ messageId: 'ssjsNotSupportedInMcn' }],
        },
        // WSProxy instance call flagged (construction + call = two reports).
        {
            code: 'var api = new Script.Util.WSProxy(); api.retrieve("DataExtension", ["Name"], {});',
            errors: [
                { messageId: 'ssjsNotSupportedInMcn' },
                { messageId: 'ssjsNotSupportedInMcn' },
            ],
        },
        // apiVersion has no effect — still flagged.
        {
            code: 'Platform.Function.Lookup("DE", "F", "K", "V");',
            options: [{ apiVersion: 67 }],
            errors: [{ messageId: 'ssjsNotSupportedInMcn' }],
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
            // Now accepts an optional boolean (0-1 args are both valid)
            code: 'Platform.Function.Now(true);',
        },
        {
            code: 'Platform.Function.Stringify("hello");',
        },
        {
            // Correct 3-arg signature: deName, fieldNamesArray, fieldValuesArray
            code: 'Platform.Function.InsertData("DE", ["Col1"], ["Val1"]);',
        },
    ],
    invalid: [
        {
            code: 'Platform.Function.Lookup();',
            errors: [{ messageId: 'tooFewArgs' }],
        },
        {
            // Now accepts at most 1 arg; 2 args should be flagged
            code: 'Platform.Function.Now(true, "tooMany");',
            errors: [{ messageId: 'tooManyArgs' }],
        },
        {
            // Stringify accepts exactly 1 arg; 2 args should be flagged
            code: 'Platform.Function.Stringify("a", "b");',
            errors: [{ messageId: 'tooManyArgs' }],
        },
    ],
});

// ─── 6. ssjs-no-deprecated-function ───────────────────────────────────────────

ssjsTester.run('ssjs-no-deprecated-function', ssjsNoDeprecatedFunction, {
    valid: [
        // Non-deprecated functions
        { code: 'Platform.Function.ContentBlockByKey("MyBlock");' },
        { code: 'Platform.Function.ContentBlockByID(12345);' },
        { code: 'var de = DataExtension.Init("MyDE"); de.Retrieve();' },
        // Unrelated bare call — not deprecated
        { code: 'Write("hello");' },
    ],
    invalid: [
        // Bare global alias
        {
            code: 'var html = ContentAreaByName("Public Content/MyBlock");',
            errors: [{ messageId: 'deprecatedGlobal' }],
        },
        {
            code: 'var html = ContentArea(12345);',
            errors: [{ messageId: 'deprecatedGlobal' }],
        },
        // Platform.Function deprecated
        {
            code: 'Platform.Function.ContentAreaByName("Public Content/MyBlock");',
            errors: [{ messageId: 'deprecatedPlatformFunction' }],
        },
        {
            code: 'Platform.Function.ContentArea(12345);',
            errors: [{ messageId: 'deprecatedPlatformFunction' }],
        },
        // ContentAreaObj static method
        {
            code: 'var results = ContentAreaObj.Retrieve({ Property: "CustomerKey", SimpleOperator: "equals", Value: "myCA" });',
            errors: [{ messageId: 'deprecatedCoreStatic' }],
        },
        {
            code: 'ContentAreaObj.Add({ CustomerKey: "test" });',
            errors: [{ messageId: 'deprecatedCoreStatic' }],
        },
        // ContentAreaObj instance method
        {
            code: 'var area = ContentAreaObj.Init("myCA"); area.Update({ Name: "New" });',
            errors: [{ messageId: 'deprecatedCoreInstance' }],
        },
        {
            code: 'var area = ContentAreaObj.Init("myCA"); area.Remove();',
            errors: [{ messageId: 'deprecatedCoreInstance' }],
        },
    ],
});

// ─── 7. ssjs-no-property-call ─────────────────────────────────────────────────

ssjsTester.run('ssjs-no-property-call', ssjsNoPropertyCall, {
    valid: [
        // Properties accessed correctly (no parentheses)
        { code: 'var m = Platform.Request.Method;' },
        { code: 'var ip = Platform.Request.ClientIP;' },
        { code: 'var ct = Platform.Response.ContentType;' },
        // Real methods called correctly (with parentheses)
        { code: 'Platform.Request.GetQueryStringParameter("id");' },
        { code: 'Platform.Response.Write("<p>Hi</p>");' },
    ],
    invalid: [
        // Platform.Request property read with parens — fix: remove ()
        {
            code: 'var m = Platform.Request.Method();',
            errors: [{ messageId: 'propertyReadWithCall' }],
            output: 'var m = Platform.Request.Method;',
        },
        {
            code: 'var ip = Platform.Request.ClientIP();',
            errors: [{ messageId: 'propertyReadWithCall' }],
            output: 'var ip = Platform.Request.ClientIP;',
        },
        {
            code: 'if (Platform.Request.HasSSL()) {}',
            errors: [{ messageId: 'propertyReadWithCall' }],
            output: 'if (Platform.Request.HasSSL) {}',
        },
        // Platform.Request property called with args — read-only, no fix
        {
            code: 'Platform.Request.Method("POST");',
            errors: [{ messageId: 'readOnlyPropertySet' }],
        },
        // Platform.Response property read with parens — fix: remove ()
        {
            code: 'var ct = Platform.Response.ContentType();',
            errors: [{ messageId: 'propertyReadWithCall' }],
            output: 'var ct = Platform.Response.ContentType;',
        },
        // Platform.Response property set via function call — fix: convert to assignment
        {
            code: 'Platform.Response.ContentType("application/json");',
            errors: [{ messageId: 'writablePropertySet' }],
            output: 'Platform.Response.ContentType = "application/json";',
        },
        {
            code: 'Platform.Response.CharacterSet("UTF-8");',
            errors: [{ messageId: 'writablePropertySet' }],
            output: 'Platform.Response.CharacterSet = "UTF-8";',
        },
        {
            code: 'Platform.Response.ContentType("application/json"), foo();',
            errors: [{ messageId: 'writablePropertySet' }],
            output: 'Platform.Response.ContentType = "application/json", foo();',
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
            output: 'for (var i = 0, _len = arr.length; i < _len; i++) {}',
            errors: [{ messageId: 'cacheLength' }],
        },
        {
            code: 'for (var i = 0; i < rows.length; i++) {}',
            output: 'for (var i = 0, _len = rows.length; i < _len; i++) {}',
            errors: [{ messageId: 'cacheLength' }],
        },
        {
            // No auto-fix when init is not a VariableDeclaration — still reported
            code: 'for (i = 0; i < arr.length; i++) {}',
            errors: [{ messageId: 'cacheLength' }],
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
            code: 'for (var k in obj) { doSomething(k); }',
            output: 'for (var k in obj) { if (obj.hasOwnProperty(k)) { doSomething(k); } }',
            errors: [{ messageId: 'missingGuard' }],
        },
        {
            code: "for (var k in obj) { if (k !== '_type') { use(k); } }",
            output: "for (var k in obj) { if (obj.hasOwnProperty(k)) { if (k !== '_type') { use(k); } } }",
            errors: [{ messageId: 'missingGuard' }],
        },
        {
            code: 'for (var k in obj) doSomething(k);',
            output: 'for (var k in obj) { if (obj.hasOwnProperty(k)) { doSomething(k); } }',
            errors: [{ messageId: 'missingGuard' }],
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
            errors: [
                { messageId: 'outdatedVersion', data: { actual: '(none)', expected: '1.1.5' } },
            ],
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

        // KNOWN_UNSUPPORTED — ignore option suppresses
        {
            code: 'JSON.parse("{}");',
            options: [{ ignore: ['parse'] }],
        },
        {
            code: 'var s = "hi"; s.trimStart();',
            options: [{ ignore: ['trimStart'] }],
        },

        // KNOWN_UNSUPPORTED method name on an SFMC receiver — never flagged
        { code: 'DataExtension.flat();' },
    ],
    invalid: [
        // ── Prototype methods (unavailable) ──────────────────────────────────
        {
            code: 'var a = [1,2,3]; a.map(function(x){ return x * 2; });',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'map' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.filter(function(x){ return x > 1; });',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'filter' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.find(function(x){ return x === 2; });',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'find' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.findIndex(function(x){ return x === 2; });',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'findIndex' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.forEach(function(x){ Write(x); });',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'forEach' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.reduce(function(acc,x){ return acc + x; }, 0);',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'reduce' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.reduceRight(function(acc,x){ return acc + x; }, 0);',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'reduceRight' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.fill(0);',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'fill' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.entries();',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'entries' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.copyWithin(1, 0);',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'copyWithin' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: 'var a = [1,2,3]; a.includes(2);',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'includes' },
                    suggestions: 1,
                },
            ],
        },

        // ── indexOf / lastIndexOf on literal arrays (unambiguous) ─────────────
        {
            code: '[1,2,3].indexOf(2);',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array.prototype', method: 'indexOf' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: '[1,2,3].lastIndexOf(2);',
            errors: [
                {
                    messageId: 'broken',
                    data: { owner: 'Array.prototype', method: 'lastIndexOf' },
                    suggestions: 1,
                },
            ],
        },

        // ── Broken prototype methods ──────────────────────────────────────────
        {
            code: 'var a = [1,2,3]; a.splice(1, 1);',
            errors: [
                {
                    messageId: 'broken',
                    data: { owner: 'Array.prototype', method: 'splice' },
                    suggestions: 1,
                },
            ],
        },

        // ── Static methods ────────────────────────────────────────────────────
        {
            code: 'Array.of(1, 2, 3);',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'Array', method: 'of' },
                    suggestions: 1,
                },
            ],
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
                                '/**\n' +
                                ' * Polyfill for Array.prototype.some (SFMC SSJS).\n' +
                                ' * @param {Function} predicate - test called with (element, index, array)\n' +
                                ' * @returns {boolean} true when the predicate passes for any element\n' +
                                ' */\n' +
                                'Array.prototype.some = Array.prototype.some || function (predicate) {\n' +
                                "    if (typeof predicate !== 'function') { return false; }\n" +
                                '    for (var i = 0; i < this.length; i++) {\n' +
                                '        if (predicate(this[i], i, this)) { return true; }\n' +
                                '    }\n' +
                                '    return false;\n' +
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
                                '/**\n' +
                                ' * Polyfill for Array.isArray (SFMC SSJS).\n' +
                                ' * @param {*} value - the value to test\n' +
                                ' * @returns {boolean} true when the value is an Array\n' +
                                ' */\n' +
                                'Array.isArray = Array.isArray || function (value) {\n' +
                                "    return Object.prototype.toString.call(value) === '[object Array]';\n" +
                                '};',
                        },
                    ],
                },
            ],
        },

        // ── KNOWN_UNSUPPORTED static members (no polyfill, suggestion only) ───
        {
            code: 'JSON.parse("{}");',
            errors: [
                {
                    messageId: 'unavailableNoPolyfill',
                    data: {
                        owner: 'JSON',
                        method: 'parse',
                        suggestion:
                            'JSON is undefined in SFMC SSJS. Use Platform.Function.ParseJSON(string) instead of JSON.parse.',
                    },
                    suggestions: 0,
                },
            ],
        },
        {
            code: 'Object.keys(obj);',
            errors: [
                {
                    messageId: 'unavailableNoPolyfill',
                    data: {
                        owner: 'Object',
                        method: 'keys',
                        suggestion:
                            'Object.keys is unavailable in SFMC. Use a for...in loop with hasOwnProperty.',
                    },
                    suggestions: 0,
                },
            ],
        },

        // ── KNOWN_UNSUPPORTED prototype members (no polyfill, suggestion only) ─
        {
            code: 'var s = "hi"; s.trimStart();',
            errors: [
                {
                    messageId: 'unavailableNoPolyfill',
                    data: {
                        owner: 'String',
                        method: 'trimStart',
                        suggestion: String.raw`String.prototype.trimStart is unavailable in SFMC. Use a /^\s+/ replace.`,
                    },
                    suggestions: 0,
                },
            ],
        },
        {
            code: 'var a = [1,[2]]; a.flat();',
            errors: [
                {
                    messageId: 'unavailableNoPolyfill',
                    data: {
                        owner: 'Array',
                        method: 'flat',
                        suggestion:
                            'Array.prototype.flat is unavailable in SFMC. Concatenate nested arrays manually in a loop.',
                    },
                    suggestions: 0,
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
            output: 'function foo() { var _result = { a: 1 };\n                 return _result; }',
            errors: [{ messageId: 'unsupported' }],
        },
    ],
});

ssjsTester.run('ssjs-no-unsupported-syntax (NewExpression)', ssjsNoUnsupportedSyntax, {
    valid: [
        { code: 'var d = new Date();' },
        { code: 'var r = new RegExp("abc");' },
        { code: 'var e = new Error("fail");' },
        { code: 'var proxy = new Script.Util.WSProxy();' },
        { code: 'var instance = MyClass();' },
    ],
    invalid: [
        {
            code: 'var proxy = new WSProxy();',
            errors: [{ messageId: 'unsupported' }],
        },
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
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'String.prototype', method: 'trim' },
                    suggestions: 1,
                },
            ],
        },
        {
            code: '"hello".endsWith("lo");',
            errors: [
                {
                    messageId: 'unavailable',
                    data: { owner: 'String.prototype', method: 'endsWith' },
                    suggestions: 1,
                },
            ],
        },
    ],
});

// ─── 19. ssjs-prefer-parsejson-safe-arg ──────────────────────────────────────

ssjsTester.run('ssjs-prefer-parsejson-safe-arg', ssjsPreferParsejsonSafeArgument, {
    valid: [
        { code: "Platform.Function.ParseJSON(someVar + '');" },
        { code: "Platform.Function.ParseJSON('' + someVar);" },
        { code: String.raw`Platform.Function.ParseJSON("{\"a\":1}");` },
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
    valid: [{ code: 'switch(x) { case 1: break; case 2: break; }' }, { code: 'var x = 1;' }],
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
            code: String.raw`Platform.Function.TreatAsContent("%%[ Set @x = Trim(\"" + myVar + "\") ]%%");`,
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
        // Two sibling blocks in a raw .amp file: the 2nd %%[ is not nested.
        { code: '%%[ set @x = 1 ]%%\n\n%%[ set @y = 2 ]%%' },
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

    it('extracts {{ }} Handlebars expressions as a single virtual .hbs file', () => {
        const html = '<p>Hello {{firstName}}, you have {{add 1 2}} points</p>';
        const result = preprocess(html, 'test.html');
        const hbsBlocks = result.filter((b) => b.filename && b.filename.endsWith('.hbs'));
        assert.equal(hbsBlocks.length, 1, 'Should extract exactly one .hbs block');
        assert.ok(hbsBlocks[0].text.includes('{{firstName}}'));
        assert.ok(hbsBlocks[0].text.includes('{{add 1 2}}'));
    });

    it('extracts {!$...} bindings into the virtual .hbs file', () => {
        const html = '<p>{!$organization.Address}</p>';
        const result = preprocess(html, 'test.html');
        const hbsBlocks = result.filter((b) => b.filename && b.filename.endsWith('.hbs'));
        assert.equal(hbsBlocks.length, 1, 'Should extract one .hbs block for bindings');
        assert.ok(hbsBlocks[0].text.includes('{!$organization.Address}'));
    });

    it('blanks AMPscript regions but keeps Handlebars in the virtual .hbs file', () => {
        const html = '%%[set @x = 1]%%<p>{{firstName}}</p>';
        const result = preprocess(html, 'test.html');
        const hbsBlocks = result.filter((b) => b.filename && b.filename.endsWith('.hbs'));
        assert.equal(hbsBlocks.length, 1, 'Should extract one .hbs block');
        // AMPscript is blanked so the Handlebars parser never sees %%[ ]%%
        assert.ok(!hbsBlocks[0].text.includes('%%['), 'AMPscript region should be blanked');
        assert.ok(!hbsBlocks[0].text.includes('set @x'), 'AMPscript body should be blanked');
        // Offsets are preserved: the .hbs text has the same length as the source
        assert.equal(hbsBlocks[0].text.length, html.length, 'Offsets must be preserved');
        // Handlebars content survives
        assert.ok(hbsBlocks[0].text.includes('{{firstName}}'));
    });

    it('does not emit a .hbs file when there is no Handlebars or binding syntax', () => {
        const html = '<p>Just HTML</p>%%[set @x = 1]%%';
        const result = preprocess(html, 'test.html');
        const hbsBlocks = result.filter((b) => b.filename && b.filename.endsWith('.hbs'));
        assert.equal(hbsBlocks.length, 0, 'No .hbs block should be emitted without {{ or {!$');
    });

    it('postprocess flattens messages', () => {
        const messages = [['msg1', 'msg2'], ['msg3']];
        const result = postprocess(messages);
        assert.deepEqual(result, ['msg1', 'msg2', 'msg3']);
    });
});

console.log('All combined processor tests passed.');

// ─── 22. ssjs-arg-types ───────────────────────────────────────────────────────

ssjsTester.run('ssjs-arg-types', ssjsArgumentTypes, {
    valid: [
        { code: 'Platform.Function.Lookup("DE", "field", "key", "val");' },
        {
            code: 'var api = new Script.Util.WSProxy(); api.retrieve("DataExtension", ["Name"], {});',
        },
    ],
    invalid: [
        {
            code: 'Platform.Function.Now(123);',
            errors: [{ messageId: 'typeMismatch' }],
        },
        {
            code: 'Platform.Function.Lookup(123, "field", "key", "val");',
            errors: [{ messageId: 'typeMismatch' }],
        },
    ],
});

// ─── 23. ssjs-core-method-arity ───────────────────────────────────────────────

ssjsTester.run('ssjs-core-method-arity', ssjsCoreMethodArity, {
    valid: [
        { code: 'DataExtension.Init("key");' },
        {
            code: 'BounceEvent.Retrieve({ Property: "SendID", SimpleOperator: "equals", Value: 12345 });',
        },
        // Instance sub-path with the correct arity passes.
        { code: 'var de = DataExtension.Init("key");\nde.Rows.Add(row);' },
    ],
    invalid: [
        {
            code: 'DataExtension.Init();',
            errors: [{ messageId: 'tooFewArgs' }],
        },
        {
            code: 'DataExtension.Init("key", "extra");',
            errors: [{ messageId: 'tooManyArgs' }],
        },
        // Instance sub-path: de.Rows.Add resolves via the tracked DataExtension.Init instance.
        {
            code: 'var de = DataExtension.Init("key");\nde.Rows.Add(row, "extra");',
            errors: [{ messageId: 'tooManyArgs' }],
        },
    ],
});

console.log('All ssjs-arg-types and ssjs-core-method-arity tests passed.');

// ═══════════════════════════════════════════════════════════════════════════════
// Handlebars (Marketing Cloud Next) Rule Tests
// ═══════════════════════════════════════════════════════════════════════════════

const hbsTester = new RuleTester({
    languageOptions: { parser: handlebarsParser },
});

// ── H1. hbs-no-unknown-helper ─────────────────────────────────────────────────

hbsTester.run('hbs-no-unknown-helper', hbsNoUnknownHelper, {
    valid: [
        // Known inline helper invocation
        { code: '{{add 1 2}}' },
        { code: '{{uppercase name}}' },
        // Known block helper
        { code: '{{#each items}}{{this}}{{/each}}' },
        { code: '{{#if ready}}yes{{/if}}' },
        // Bare mustache with no args is a data binding, not a helper invocation
        { code: '<p>{{firstName}}</p>' },
        { code: '{{customer.email}}' },
        // Plain HTML content with no Handlebars
        { code: '<p>Hello world</p>' },
        // Known helper as subexpression
        { code: '{{uppercase (concat first last)}}' },
    ],
    invalid: [
        // Unknown inline helper (with args → invocation)
        {
            code: '{{fooBar 1 2}}',
            errors: [{ messageId: 'unknownHelper', data: { kind: 'helper', name: 'fooBar' } }],
        },
        // Unknown block helper
        {
            code: '{{#fooBlock items}}{{this}}{{/fooBlock}}',
            errors: [
                { messageId: 'unknownHelper', data: { kind: 'block helper', name: 'fooBlock' } },
            ],
        },
        // Unknown helper with a close catalog match → suggestion
        {
            code: '{{addd 1 2}}',
            errors: [
                {
                    messageId: 'unknownHelperSuggest',
                    data: { kind: 'helper', name: 'addd', suggestion: 'add' },
                },
            ],
        },
        // Unknown helper in a subexpression
        {
            code: '{{uppercase (fooBar x)}}',
            errors: [{ messageId: 'unknownHelper', data: { kind: 'helper', name: 'fooBar' } }],
        },
    ],
});

// ── H2. hbs-helper-arity ──────────────────────────────────────────────────────

hbsTester.run('hbs-helper-arity', hbsHelperArity, {
    valid: [
        // add requires exactly 2 positional args
        { code: '{{add 1 2}}' },
        // concat is variadic (1 required, no upper bound)
        { code: '{{concat a}}' },
        { code: '{{concat a b c d}}' },
        // each block helper with its single collection arg
        { code: '{{#each items}}{{this}}{{/each}}' },
        // Bare mustache binding (no args) — not validated as an invocation
        { code: '{{firstName}}' },
        // Unknown helper — arity rule defers to no-unknown-helper
        { code: '{{fooBar 1 2 3}}' },
    ],
    invalid: [
        // add with too few args
        {
            code: '{{add 1}}',
            errors: [{ messageId: 'tooFewArgs', data: { name: 'add', min: '2', actual: '1' } }],
        },
        // add with too many args
        {
            code: '{{add 1 2 3}}',
            errors: [{ messageId: 'tooManyArgs', data: { name: 'add', max: '2', actual: '3' } }],
        },
        // concat with zero args as a subexpression (always an invocation; requires at least 1)
        {
            code: '{{uppercase (concat)}}',
            errors: [{ messageId: 'tooFewArgs', data: { name: 'concat', min: '1', actual: '0' } }],
        },
    ],
});

// ── H3. hbs-no-unknown-binding ────────────────────────────────────────────────

hbsTester.run('hbs-no-unknown-binding', hbsNoUnknownBinding, {
    valid: [
        // Known built-in bindings
        { code: '<p>{!$organization.Address}</p>' },
        { code: '{!$link.EmailAddressOptOutUrl}' },
        { code: '{!$link.PreferenceCenterUrl}' },
        // No binding syntax at all
        { code: '<p>{{firstName}}</p>' },
    ],
    invalid: [
        // Unknown binding with no close match
        {
            code: '<p>{!$foo.Bar}</p>',
            errors: [{ messageId: 'unknownBinding', data: { token: '{!$foo.Bar}' } }],
        },
        // Unknown binding with a close catalog match → suggestion
        {
            code: '{!$organization.Addres}',
            errors: [
                {
                    messageId: 'unknownBindingSuggest',
                    data: {
                        token: '{!$organization.Addres}',
                        suggestion: '{!$organization.Address}',
                    },
                },
            ],
        },
    ],
});

// ── H4. hbs-no-unsupported-construct ──────────────────────────────────────────

hbsTester.run('hbs-no-unsupported-construct', hbsNoUnsupportedConstruct, {
    valid: [
        // Supported helpers and blocks
        { code: '{{add 1 2}}' },
        { code: '{{#each items}}{{this}}{{/each}}' },
        { code: '<p>{{firstName}}</p>' },
    ],
    invalid: [
        // Partial
        {
            code: '{{> myPartial}}',
            errors: [{ messageId: 'partial' }],
        },
        // Partial block
        {
            code: '{{#> layout}}content{{/layout}}',
            errors: [{ messageId: 'partial-block' }],
        },
        // Decorator
        {
            code: '{{* myDecorator}}',
            errors: [{ messageId: 'decorator' }],
        },
        // log helper (handlebars.js-only debugging helper)
        {
            code: '{{log message}}',
            errors: [{ messageId: 'log' }],
        },
    ],
});

// ── H5. hbs-no-mcn-unsupported ────────────────────────────────────────────────

hbsTester.run('hbs-no-mcn-unsupported', hbsNoMcnUnsupported, {
    valid: [
        // No apiVersion → nothing flagged (no null-mcnSince items in the catalog).
        { code: '{{dateAdd d 1}}' },
        // Helper available at the target version (add: mcnSince 65).
        { code: '{{add 1 2}}', options: [{ apiVersion: 65 }] },
        // Helper introduced exactly at the target version (dateAdd: mcnSince 67).
        { code: '{{dateAdd d 1}}', options: [{ apiVersion: 67 }] },
        // Bare binding — not an invocation, not checked.
        { code: '{{firstName}}', options: [{ apiVersion: 65 }] },
        // Unknown helper is handled by hbs-no-unknown-helper, not here.
        { code: '{{totallyUnknownHelper x}}', options: [{ apiVersion: 65 }] },
        // Supported binding at the target version passes.
        { code: '{!$organization.Address}', options: [{ apiVersion: 65 }] },
    ],
    invalid: [
        // dateAdd (mcnSince 67) used while targeting 65.
        {
            code: '{{dateAdd d 1}}',
            options: [{ apiVersion: 65 }],
            errors: [
                {
                    messageId: 'helperTooNew',
                    data: { name: 'dateAdd', since: '67', target: '65' },
                },
            ],
        },
        // lookup (mcnSince 67) as a block-less invocation while targeting 65.
        {
            code: '{{lookup "DE" "key"}}',
            options: [{ apiVersion: 65 }],
            errors: [
                {
                    messageId: 'helperTooNew',
                    data: { name: 'lookup', since: '67', target: '65' },
                },
            ],
        },
        // Binding (mcnSince 65) too new for an older target.
        {
            code: '{!$organization.Address}',
            options: [{ apiVersion: 40 }],
            errors: [
                {
                    messageId: 'bindingTooNew',
                    data: { token: '{!$organization.Address}', since: '65', target: '40' },
                },
            ],
        },
    ],
});

console.log('All Handlebars (MCN) rule tests passed.');

// ═══════════════════════════════════════════════════════════════════════════════
// Handlebars end-to-end config wiring (processor + .hbs routing)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Verifies the full pipeline: the combined processor extracts {{...}} from HTML
// into a virtual .hbs file, and the -next configs lint it while the classic
// configs leave it alone.

/**
 * Lints an HTML string with a flat config array and returns the messages.
 *
 * @param {Array} config - Flat ESLint config array (e.g. a plugin config).
 * @param {string} html - HTML source containing embedded Handlebars.
 * @returns {Promise.<import('eslint').Linter.LintMessage[]>} Lint messages.
 */
async function lintHtml(config, html) {
    const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: config,
        cwd: process.cwd(),
        warnIgnored: false,
    });
    const results = await eslint.lintText(html, { filePath: 'fixture.html' });
    return results[0]?.messages ?? [];
}

describe('Handlebars config wiring (embedded HTML)', () => {
    // Unknown helper + unsupported construct in one document.
    const html = '<p>{{fooBar 1 2}}</p>\n<p>{{> myPartial}}</p>\n';

    it('embedded-next flags Handlebars issues in HTML', async () => {
        const messages = await lintHtml(sfmcPlugin.configs['embedded-next'], html);
        const ruleIds = messages.map((m) => m.ruleId);
        assert.ok(
            ruleIds.includes('sfmc/hbs-no-unknown-helper'),
            `Expected hbs-no-unknown-helper, got ${JSON.stringify(ruleIds)}`,
        );
        assert.ok(
            ruleIds.includes('sfmc/hbs-no-unsupported-construct'),
            `Expected hbs-no-unsupported-construct, got ${JSON.stringify(ruleIds)}`,
        );
    });

    it('classic embedded config does NOT flag Handlebars in HTML', async () => {
        const messages = await lintHtml(sfmcPlugin.configs.embedded, html);
        const hbsMessages = messages.filter((m) => m.ruleId && m.ruleId.startsWith('sfmc/hbs-'));
        assert.deepEqual(
            hbsMessages.map((m) => m.ruleId),
            [],
            'Classic (non-MCN) config must not emit any hbs-* diagnostics',
        );
    });

    it('plain HTML with no Handlebars produces no hbs diagnostics in -next', async () => {
        const plain = '<p>Hello world</p>';
        const messages = await lintHtml(sfmcPlugin.configs['embedded-next'], plain);
        const hbsMessages = messages.filter((m) => m.ruleId && m.ruleId.startsWith('sfmc/hbs-'));
        assert.deepEqual(hbsMessages, [], 'Plain HTML must not trigger hbs-* rules');
    });
});

/**
 * Lints a standalone Handlebars source string with a flat config array.
 *
 * @param {Array} config - Flat ESLint config array (e.g. a plugin config).
 * @param {string} hbs - Handlebars source (the full file, no HTML wrapper).
 * @returns {Promise.<import('eslint').Linter.LintMessage[]>} Lint messages.
 */
async function lintHbs(config, hbs) {
    const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: config,
        cwd: process.cwd(),
        warnIgnored: false,
    });
    const results = await eslint.lintText(hbs, { filePath: 'fixture.hbs' });
    return results[0]?.messages ?? [];
}

describe('Handlebars config wiring (standalone .hbs)', () => {
    // Unknown helper + unsupported construct in one standalone Handlebars file.
    const hbs = '<p>{{fooBar 1 2}}</p>\n{{> myPartial}}\n';

    it('recommended-next lints standalone .hbs files', async () => {
        const messages = await lintHbs(sfmcPlugin.configs['recommended-next'], hbs);
        const ruleIds = messages.map((m) => m.ruleId);
        assert.ok(
            ruleIds.includes('sfmc/hbs-no-unknown-helper'),
            `Expected hbs-no-unknown-helper, got ${JSON.stringify(ruleIds)}`,
        );
        assert.ok(
            ruleIds.includes('sfmc/hbs-no-unsupported-construct'),
            `Expected hbs-no-unsupported-construct, got ${JSON.stringify(ruleIds)}`,
        );
    });

    it('strict-next lints standalone .hbs files', async () => {
        const messages = await lintHbs(sfmcPlugin.configs['strict-next'], hbs);
        const ruleIds = messages.map((m) => m.ruleId);
        assert.ok(
            ruleIds.includes('sfmc/hbs-no-unknown-helper'),
            `Expected hbs-no-unknown-helper in strict-next, got ${JSON.stringify(ruleIds)}`,
        );
    });

    it('classic recommended config does NOT lint standalone .hbs files', async () => {
        const messages = await lintHbs(sfmcPlugin.configs.recommended, hbs);
        const hbsMessages = messages.filter((m) => m.ruleId && m.ruleId.startsWith('sfmc/hbs-'));
        assert.deepEqual(
            hbsMessages.map((m) => m.ruleId),
            [],
            'Classic (MCE) recommended config must not emit hbs-* diagnostics for .hbs files',
        );
    });

    it('classic strict config does NOT lint standalone .hbs files', async () => {
        const messages = await lintHbs(sfmcPlugin.configs.strict, hbs);
        const hbsMessages = messages.filter((m) => m.ruleId && m.ruleId.startsWith('sfmc/hbs-'));
        assert.deepEqual(
            hbsMessages.map((m) => m.ruleId),
            [],
            'Classic (MCE) strict config must not emit hbs-* diagnostics for .hbs files',
        );
    });
});

console.log('All Handlebars config-wiring tests passed.');

// ═══════════════════════════════════════════════════════════════════════════════
// MSO / Outlook email config wiring (processor delegation + mso/* routing)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Verifies that the combined sfmc processor delegates MSO extraction to
// eslint-plugin-mso-email and that the re-exported mso/* rule-configs fire
// through the embedded/strict configs — without a second processor and without
// a processor conflict.

describe('MSO config wiring (embedded HTML)', () => {
    // An invalid MSO condition ("mos" typo) plus a layout table missing
    // role="presentation" — one conditional-rule error and one document-rule warning.
    const html = ['<!--[if mos]>', '<table><tr><td>x</td></tr></table>', '<![endif]-->'].join('\n');

    it('strict flags the invalid MSO condition (mso/valid-mso-condition)', async () => {
        const messages = await lintHtml(sfmcPlugin.configs.strict, html);
        const ruleIds = messages.map((m) => m.ruleId);
        assert.ok(
            ruleIds.includes('mso/valid-mso-condition'),
            `Expected mso/valid-mso-condition, got ${JSON.stringify(ruleIds)}`,
        );
    });

    it('strict flags the layout table missing role (mso/table-presentation-role)', async () => {
        const messages = await lintHtml(sfmcPlugin.configs.strict, html);
        const ruleIds = messages.map((m) => m.ruleId);
        assert.ok(
            ruleIds.includes('mso/table-presentation-role'),
            `Expected mso/table-presentation-role, got ${JSON.stringify(ruleIds)}`,
        );
    });

    it('embedded also flags MSO issues in HTML', async () => {
        const messages = await lintHtml(sfmcPlugin.configs.embedded, html);
        const ruleIds = messages.map((m) => m.ruleId);
        assert.ok(
            ruleIds.includes('mso/valid-mso-condition'),
            `Expected mso/valid-mso-condition in embedded, got ${JSON.stringify(ruleIds)}`,
        );
    });

    it('does not emit an MSO document block for plain HTML without MSO markup', () => {
        // The sfmc processor only delegates to MSO when MSO markup is present, so a
        // plain table (no conditional comment) must NOT be extracted as an MSO block.
        const plain = '<table><tr><td>x</td></tr></table>';
        const result = preprocess(plain, 'plain.html');
        const msoBlocks = result.filter(
            (b) => b.filename && (b.filename.endsWith('.mso') || b.filename.endsWith('.msohtml')),
        );
        assert.deepEqual(msoBlocks, [], 'No MSO blocks should be emitted without MSO markup');
    });

    it('delegates MSO extraction when MSO markup is present', () => {
        const withMso = '<!--[if mso]>\n<p>x</p>\n<![endif]-->';
        const result = preprocess(withMso, 'mso.html');
        const msoBlocks = result.filter(
            (b) => b.filename && (b.filename.endsWith('.mso') || b.filename.endsWith('.msohtml')),
        );
        assert.ok(msoBlocks.length > 0, 'MSO blocks should be appended when MSO markup is present');
    });
});

console.log('All MSO config-wiring tests passed.');

// ═══════════════════════════════════════════════════════════════════════════════
// Optional eslint-plugin-unicorn override configs (unicorn-ssjs*)
// ═══════════════════════════════════════════════════════════════════════════════
//
// These are plain rules objects with NO `plugins` key: they only resolve when the
// consumer has already loaded eslint-plugin-unicorn (which registers the `unicorn`
// plugin) earlier in the flat-config array. Assert their shape here.

describe('unicorn-ssjs override configs', () => {
    it('exposes unicorn-ssjs and unicorn-ssjs-embedded configs', () => {
        assert.ok(sfmcPlugin.configs['unicorn-ssjs'], 'unicorn-ssjs config must exist');
        assert.ok(
            sfmcPlugin.configs['unicorn-ssjs-embedded'],
            'unicorn-ssjs-embedded config must exist',
        );
    });

    it('registers NO plugins (relies on the user loading unicorn)', () => {
        assert.equal(
            sfmcPlugin.configs['unicorn-ssjs'].plugins,
            undefined,
            'unicorn-ssjs must not register any plugin',
        );
        assert.equal(
            sfmcPlugin.configs['unicorn-ssjs-embedded'].plugins,
            undefined,
            'unicorn-ssjs-embedded must not register any plugin',
        );
    });

    it('targets SSJS files and embedded SSJS respectively', () => {
        assert.deepEqual(sfmcPlugin.configs['unicorn-ssjs'].files, ['**/*.ssjs']);
        assert.deepEqual(sfmcPlugin.configs['unicorn-ssjs-embedded'].files, ['**/*.html/*.js']);
    });

    it('turns every override rule OFF and only touches unicorn/* rules', () => {
        const rules = sfmcPlugin.configs['unicorn-ssjs'].rules;
        const ruleNames = Object.keys(rules);
        assert.ok(ruleNames.length > 0, 'Expected at least one overridden rule');
        for (const name of ruleNames) {
            assert.ok(
                name.startsWith('unicorn/'),
                `Only unicorn/* rules may be overridden, found ${name}`,
            );
            assert.equal(rules[name], 'off', `${name} must be set to 'off'`);
        }
    });

    it('both configs override the identical rule set', () => {
        assert.deepEqual(
            Object.keys(sfmcPlugin.configs['unicorn-ssjs'].rules).toSorted((a, b) =>
                a.localeCompare(b),
            ),
            Object.keys(sfmcPlugin.configs['unicorn-ssjs-embedded'].rules).toSorted((a, b) =>
                a.localeCompare(b),
            ),
        );
    });
});

console.log('All unicorn-ssjs override-config tests passed.');
