import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detection Rule Builder | BlockStop",
  description: "Build custom threat detection rules with advanced conditions",
};

export default function DetectionRuleBuilder() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Detection Rule Builder</h1>
          <p className="text-gray-600 mt-2">
            Create and manage custom threat detection rules
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900">New Detection Rule</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Rule Metadata */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Rule Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Detect Suspicious Admin Access"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe what this rule detects..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Select severity...</option>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Conditions</h3>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  + Add Condition
                </button>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Field
                      </label>
                      <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                        <option>Select field...</option>
                        <option>source_ip</option>
                        <option>user_id</option>
                        <option>event_type</option>
                        <option>action</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Operator
                      </label>
                      <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                        <option>equals</option>
                        <option>contains</option>
                        <option>regex</option>
                        <option>&gt;</option>
                        <option>&lt;</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Enter value..."
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">Logic: <span className="font-medium">AND</span></p>
                </div>

                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                        <option>Select field...</option>
                        <option>source_ip</option>
                        <option>user_id</option>
                        <option>event_type</option>
                      </select>
                    </div>
                    <div>
                      <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                        <option>equals</option>
                        <option>contains</option>
                        <option>regex</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Enter value..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  + Add Action
                </button>
              </div>

              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="ml-2 text-sm text-gray-700">Create Alert</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-2 text-sm text-gray-700">Quarantine Asset</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-2 text-sm text-gray-700">Notify SOC Team</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-2 text-sm text-gray-700">Block Network Access</span>
                </label>
              </div>
            </div>

            {/* MITRE Techniques */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">MITRE Techniques</h3>
              <div>
                <input
                  type="text"
                  placeholder="Add MITRE ATT&CK technique (e.g., T1005)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
                Save Rule
              </button>
              <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 rounded-lg transition">
                Test Rule
              </button>
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition">
                Deploy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
