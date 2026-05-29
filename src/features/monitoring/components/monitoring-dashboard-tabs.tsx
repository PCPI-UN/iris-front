'use client';

import { Award, BarChart3, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MonitoringTab } from '../types';

type MonitoringDashboardTabsProps = {
  activeTab: MonitoringTab;
  onTabChange: (tab: MonitoringTab) => void;
};

export const MonitoringDashboardTabs = ({ activeTab, onTabChange }: MonitoringDashboardTabsProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        className={activeTab === 'statistics' ? 'border-2 border-foreground bg-foreground text-background' : ''}
        variant={activeTab === 'statistics' ? 'flat' : 'bordered'}
        onPress={() => onTabChange('statistics')}
      >
        <BarChart3 className="mr-2 h-4 w-4 text-sky-500" />
        Estadísticas
      </Button>
      <Button
        className={activeTab === 'projects' ? 'border-2 border-foreground bg-foreground text-background' : ''}
        variant={activeTab === 'projects' ? 'flat' : 'bordered'}
        onPress={() => onTabChange('projects')}
      >
        <Folder className="mr-2 h-4 w-4 text-violet-500" />
        Evaluación de proyectos
      </Button>
      <Button
        className={activeTab === 'ranking' ? 'border-2 border-foreground bg-foreground text-background' : ''}
        variant={activeTab === 'ranking' ? 'flat' : 'bordered'}
        onPress={() => onTabChange('ranking')}
      >
        <Award className="mr-2 h-4 w-4 text-amber-500" />
        Ranking
      </Button>
    </div>
  );
};