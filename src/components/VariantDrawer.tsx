'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, LinkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Variant } from '@/types/fhir';

interface VariantDrawerProps {
  variant: Variant | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VariantDrawer({ variant, isOpen, onClose }: VariantDrawerProps) {
  if (!variant) {
    return null;
  }
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          Detalles de la Variante
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onClick={onClose}
                          >
                            <span className="sr-only">Cerrar panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative flex-1 px-4 sm:px-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{variant.gene} - {variant.hgvs}</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {variant.chromosome}:{variant.position} {variant.reference}{'>'}{variant.alternate}
                          </p>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Consecuencia</dt>
                              <dd className="mt-1 text-sm text-gray-900">{variant.consequence}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Significancia ClinVar</dt>
                              <dd className="mt-1 text-sm text-gray-900">{variant.clinvarSignificance || 'No disponible'}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Frecuencia Alélica Variante</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {variant.vaf ? `${(variant.vaf * 100).toFixed(2)}%` : 'No disponible'}
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Nivel de Evidencia</dt>
                              <dd className="mt-1 text-sm text-gray-900">{variant.evidenceLevel || 'No disponible'}</dd>
                            </div>
                            {variant.filter && (
                              <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Filtro</dt>
                                <dd className="mt-1 text-sm text-gray-900">{variant.filter}</dd>
                              </div>
                            )}
                            {variant.quality && (
                              <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Calidad</dt>
                                <dd className="mt-1 text-sm text-gray-900">{variant.quality}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                        
                        {variant.evidenceUrls && variant.evidenceUrls.length > 0 && (
                          <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-medium text-gray-500">Evidencia y Literatura</h3>
                            <ul className="mt-2 divide-y divide-gray-200">
                              {variant.evidenceUrls.map((url, index) => (
                                <li key={index} className="py-2">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center text-sm text-primary-600 hover:text-primary-800"
                                  >
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    {url.replace(/^https?:\/\//, '').split('/')[0]}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {variant.oncokbData && (
                          <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-medium text-gray-500">Datos de OncoKB</h3>
                            <div className="mt-2 text-sm text-gray-600">
                              <p><span className="font-medium">Oncogénico:</span> {variant.oncokbData.oncogenic}</p>
                              {variant.oncokbData.mutationEffect && (
                                <p><span className="font-medium">Efecto de Mutación:</span> {variant.oncokbData.mutationEffect}</p>
                              )}
                              {variant.oncokbData.highestSensitiveLevel && (
                                <p><span className="font-medium">Nivel de Sensibilidad Más Alto:</span> {variant.oncokbData.highestSensitiveLevel}</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {variant.clinvarData && (
                          <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-medium text-gray-500">Datos de ClinVar</h3>
                            <div className="mt-2 text-sm text-gray-600">
                              <p><span className="font-medium">Significancia Clínica:</span> {variant.clinvarData.clinicalSignificance}</p>
                              {variant.clinvarData.reviewStatus && (
                                <p><span className="font-medium">Estado de Revisión:</span> {variant.clinvarData.reviewStatus}</p>
                              )}
                              {variant.clinvarData.lastUpdated && (
                                <p><span className="font-medium">Última Actualización:</span> {variant.clinvarData.lastUpdated}</p>
                              )}
                            </div>
                            {variant.clinvarData.variantId && (
                              <a 
                                href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvarData.variantId}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800"
                              >
                                <DocumentTextIcon className="h-4 w-4 mr-2" />
                                Ver en ClinVar
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
