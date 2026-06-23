'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Purple Team Exercise Interface
 * Red team simulations and security testing
 */
export default function PurpleTeamPage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [executionStatus, setExecutionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const startExercise = async (exerciseId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/max/purple-team/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      });
      const data = await response.json();
      setExecutionStatus(data);
      setSelectedExercise(null);
    } catch (error) {
      console.error('Exercise start error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExercises = async () => {
    try {
      const response = await fetch('/api/max/purple-team/exercises');
      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  React.useEffect(() => {
    getExercises();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purple Team Exercises</h1>
        <p className="text-gray-600">Red team simulations and security testing</p>
      </div>

      {executionStatus ? (
        // Execution Results
        <Card>
          <CardHeader>
            <CardTitle>Exercise Execution Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">Detection Rate</p>
                <p className="text-2xl font-bold">
                  {(executionStatus.detectionRate * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600">Coverage Score</p>
                <p className="text-2xl font-bold">
                  {executionStatus.coverageScore.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-gray-600">Response Time (avg)</p>
                <p className="text-2xl font-bold">{executionStatus.avgResponseTime}ms</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600">Overall Score</p>
                <p className="text-2xl font-bold">{executionStatus.score.toFixed(0)}%</p>
              </div>
            </div>

            {executionStatus.findings && executionStatus.findings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Key Findings</h3>
                <div className="space-y-2">
                  {executionStatus.findings.map((finding: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <p className="font-semibold text-sm">{finding.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{finding.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setExecutionStatus(null)} variant="outline">
              Start Another Exercise
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Exercise Selection
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exercises.length > 0 ? (
            exercises.map((exercise) => (
              <Card
                key={exercise.id}
                className={`cursor-pointer transition ${
                  selectedExercise?.id === exercise.id
                    ? 'border-blue-500 border-2 bg-blue-50'
                    : 'hover:border-gray-400'
                }`}
                onClick={() => setSelectedExercise(exercise)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{exercise.name}</CardTitle>
                      <CardDescription>{exercise.category}</CardDescription>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        exercise.difficulty === 'expert'
                          ? 'bg-red-100 text-red-700'
                          : exercise.difficulty === 'advanced'
                          ? 'bg-orange-100 text-orange-700'
                          : exercise.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {exercise.difficulty}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{exercise.description}</p>
                  <div className="space-y-2 text-sm mb-4">
                    <p>
                      <span className="font-semibold">Attack Steps:</span> {exercise.attackChain.length}
                    </p>
                    <p>
                      <span className="font-semibold">Duration:</span> ~{exercise.estimatedDuration}
                      min
                    </p>
                    <p>
                      <span className="font-semibold">Objectives:</span> {exercise.objectives.length}
                    </p>
                  </div>

                  {selectedExercise?.id === exercise.id && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startExercise(exercise.id);
                      }}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Starting...' : 'Start Exercise'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No exercises available. Loading...</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Exercise Details */}
      {selectedExercise && !executionStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Exercise Details: {selectedExercise.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Attack Chain</h3>
              <div className="space-y-2">
                {selectedExercise.attackChain.map((step: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-sm">{step.sequence}. {step.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Technique: {step.technique} ({step.mitreId})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Objectives</h3>
              <ul className="space-y-1">
                {selectedExercise.objectives.map((obj: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
