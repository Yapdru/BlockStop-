import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RuleBuilder } from "@/lib/detection-rules/rule-builder";

const ruleBuilder = new RuleBuilder();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get("enabled");

    const rules = await ruleBuilder.getAllRules(
      enabled === "true" ? true : enabled === "false" ? false : undefined
    );

    return NextResponse.json({
      success: true,
      rules,
      count: rules.length,
    });
  } catch (error) {
    console.error("[Detection Rules API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      severity,
      author,
      conditions,
      actions,
      filters,
      metadata,
    } = body;

    if (!name || !severity || !conditions) {
      return NextResponse.json(
        { error: "name, severity, and conditions are required" },
        { status: 400 }
      );
    }

    const rule = await ruleBuilder.createRule({
      name,
      description,
      enabled: true,
      severity,
      author,
      conditions,
      actions,
      filters,
      metadata,
    });

    // Validate rule
    const validation = await ruleBuilder.validateRule(rule.ruleId);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Rule validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Store in database
    await query(
      `INSERT INTO detection_rules (rule_id, name, severity, enabled, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [rule.ruleId, rule.name, rule.severity, rule.enabled, rule.author]
    );

    return NextResponse.json({
      success: true,
      rule,
      validation,
    });
  } catch (error) {
    console.error("[Detection Rules API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
