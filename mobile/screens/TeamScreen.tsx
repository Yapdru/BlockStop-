/**
 * Team Screen
 * Team management and collaboration
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileCard } from '../components/MobileCard';
import { MobileButton } from '../components/MobileButton';
import { MobileInput } from '../components/MobileInput';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.neutral[950],
  },
  content: {
    paddingHorizontal: mobileTheme.spacing[4],
    paddingVertical: mobileTheme.spacing[4],
    gap: mobileTheme.spacing[4],
  },
  header: {
    gap: mobileTheme.spacing[1],
  },
  title: {
    fontSize: mobileTheme.typography.fontSize['2xl'],
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.neutral[50],
  },
  subtitle: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
  },
  teamInfo: {
    paddingHorizontal: mobileTheme.spacing[3],
    paddingVertical: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
    gap: mobileTheme.spacing[2],
  },
  infoLabel: {
    fontSize: mobileTheme.typography.fontSize.xs,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[400],
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: mobileTheme.typography.fontSize.lg,
    fontWeight: mobileTheme.typography.fontWeight.bold as any,
    color: mobileTheme.colors.neutral[50],
  },
  membersList: {
    gap: mobileTheme.spacing[2],
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
  },
  memberInfo: {
    flex: 1,
    gap: mobileTheme.spacing[1],
  },
  memberName: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
  memberRole: {
    fontSize: mobileTheme.typography.fontSize.xs,
    color: mobileTheme.colors.neutral[400],
  },
  memberIcon: {
    fontSize: 28,
    marginRight: mobileTheme.spacing[2],
  },
  inviteSection: {
    gap: mobileTheme.spacing[3],
    paddingHorizontal: mobileTheme.spacing[3],
    paddingVertical: mobileTheme.spacing[4],
    backgroundColor: mobileTheme.colors.neutral[800],
    borderRadius: mobileTheme.borderRadius.lg,
  },
  inviteTitle: {
    fontSize: mobileTheme.typography.fontSize.base,
    fontWeight: mobileTheme.typography.fontWeight.semibold as any,
    color: mobileTheme.colors.neutral[50],
  },
  inviteDescription: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.neutral[400],
  },
});

const TEAM_MEMBERS = [
  { id: '1', name: 'John Admin', role: 'Team Lead', icon: '👤', status: 'online' },
  { id: '2', name: 'Jane Analyst', role: 'Security Analyst', icon: '👩‍💼', status: 'online' },
  { id: '3', name: 'Bob Engineer', role: 'DevOps', icon: '👨‍💻', status: 'offline' },
];

export const TeamScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [inviteEmail, setInviteEmail] = useState('');
  const { trigger } = useHapticFeedback();

  const handleInvite = () => {
    if (!inviteEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    trigger('success');
    Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
  };

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: insets.top }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Team</Text>
          <Text style={styles.subtitle}>Manage your team members</Text>
        </View>

        {/* Team Info */}
        <View style={styles.teamInfo}>
          <View>
            <Text style={styles.infoLabel}>Team Name</Text>
            <Text style={styles.infoValue}>Security Team</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>Members</Text>
            <Text style={styles.infoValue}>{TEAM_MEMBERS.length}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>Plan</Text>
            <Text style={styles.infoValue}>Pro</Text>
          </View>
        </View>

        {/* Team Members */}
        <View>
          <Text
            style={{
              fontSize: mobileTheme.typography.fontSize.lg,
              fontWeight: mobileTheme.typography.fontWeight.semibold as any,
              color: mobileTheme.colors.neutral[50],
              marginBottom: mobileTheme.spacing[2],
            }}
          >
            Team Members
          </Text>
          <View style={styles.membersList}>
            {TEAM_MEMBERS.map((member) => (
              <Pressable
                key={member.id}
                style={({ pressed }) => [
                  styles.memberItem,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  trigger('light');
                  navigation.navigate('TeamMembers');
                }}
              >
                <Text style={styles.memberIcon}>{member.icon}</Text>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      member.status === 'online'
                        ? mobileTheme.colors.success[600]
                        : mobileTheme.colors.neutral[600],
                  }}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Invite Section */}
        <View style={styles.inviteSection}>
          <Text style={styles.inviteTitle}>Invite Team Member</Text>
          <Text style={styles.inviteDescription}>
            Add a new member to your team
          </Text>
          <MobileInput
            label="Email Address"
            placeholder="member@company.com"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            variant="filled"
          />
          <MobileButton
            title="Send Invitation"
            variant="primary"
            size="md"
            onPress={handleInvite}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
