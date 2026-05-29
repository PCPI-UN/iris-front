'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Switch } from '@/components/ui/switch';
import { useUpsertRankingConfig } from '../api/upsert-ranking-config';
import type { RankingConfigType } from '../types';

type RankingConfigModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: RankingConfigType;
  onConfigChange: (config: RankingConfigType) => void;
  eventId?: number;
  rankingConfigId?: number;
  onSaved?: (configId: number, config: RankingConfigType) => void | Promise<void>;
};

export const RankingConfigModal = ({
  isOpen,
  onOpenChange,
  config,
  onConfigChange,
  eventId,
  rankingConfigId,
  onSaved,
}: RankingConfigModalProps) => {
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveRankingConfig = useUpsertRankingConfig();

  const handleSave = async (onClose: () => void) => {
    if (!eventId) {
      setSaveError('Se requiere un evento para guardar la configuración.');
      return;
    }

    setSaveError(null);

    try {
      const response = await saveRankingConfig.mutateAsync({
        eventId,
        rankingConfigId,
        config,
      });

      const savedConfigId = response?.data?.id ?? response?.id;

      if (typeof savedConfigId === 'number') {
        await onSaved?.(savedConfigId, config);
      }

      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar la configuración');
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="m-auto mx-5 lg:max-w-md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Configuración del Ranking</h2>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-5 py-4">
              {/* Posiciones visibles */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Posiciones Visibles
                </label>
                <p className="text-xs text-default-500">
                  0 = Mostrar lista completa del ranking
                </p>
                <Input
                  type="number"
                  min={0}
                  value={String(config.visiblePositions)}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      visiblePositions: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              {/* Ranking visible en landing */}
              <div className="flex items-center justify-between rounded-lg border border-default-200 p-3 bg-default-50/50">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-foreground">
                    Ranking en Landing Pública
                  </label>
                  <p className="text-xs text-default-500">
                    Mostrar ranking en la página pública
                  </p>
                </div>
                <Switch
                  isSelected={config.visibleInLanding}
                  onValueChange={(value) =>
                    onConfigChange({
                      ...config,
                      visibleInLanding: value,
                    })
                  }
                />
              </div>

              {/* Puntaje visible */}
              <div className="flex items-center justify-between rounded-lg border border-default-200 p-3 bg-default-50/50">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-foreground">
                    Puntaje Visible
                  </label>
                  <p className="text-xs text-default-500">
                    Mostrar puntajes en el ranking
                  </p>
                </div>
                <Switch
                  isSelected={config.visibleScore}
                  onValueChange={(value) =>
                    onConfigChange({
                      ...config,
                      visibleScore: value,
                    })
                  }
                />
              </div>
            </ModalBody>

            {saveError && (
              <div className="px-6 text-sm text-danger-500">
                {saveError}
              </div>
            )}

            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" isLoading={saveRankingConfig.isPending} onPress={() => handleSave(onClose)}>
                Guardar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
